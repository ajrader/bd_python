# TODO
# * Parallelize code
#     * Should get a 50 times speedup if we are able to use all 50
#       cores. If we can figure out how to distribute the job easily
#       among multiple machines, we could get a much faster speedup.
# * Auto identify max lags

# In the dataset, every state has 11 coverage types. There are 5 main
# metrics for each coverage type. There are 69 months of data associated
# with each metric.

import pandas as pd
from mltimeseries import time_series_to_cross_section, optimized_rf
import json
import numpy as np


def norm(series):
    return (series - series.mean())/series.std(ddof=1)

# class to use with json that allows proper encoding of numpy data
class NumpyAwareJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.int32) or isinstance(obj, np.int64):
            return int(obj)
        elif isinstance(obj, np.ndarray) and obj.ndim == 1:
            return obj.tolist()
        return json.JSONEncoder.default(self, obj)

data = pd.read_csv("base_data_CENT.csv")
variables_of_interest = ["Reported Count", "Paid Count", "Pending Count", "Indemnity", "Severity"]

# Create an "Overall" variable that is the normalized average of the other variables of interest
data["Overall"] = data.groupby(["STATE", "COVERAGE"]).transform(norm)[variables_of_interest].sum(axis=1)
variables_of_interest += ["Overall"]

# Group data by state
state_data_group = data.groupby("STATE")

# Auto identify states and coverages
states = state_data_group.groups.keys()
coverages = state_data_group.get_group(states[0]).groupby("COVERAGE").groups.keys()

# Data structure for APIs
startYear = 2009
startMonth = 0

overview_data = {"startYear": startYear,
                "startMonth": startMonth,
                "metrics": {}}
for variable in variables_of_interest:
    overview_data["metrics"][variable] = {}
    for coverage in coverages:
        overview_data["metrics"][variable][coverage] = {}
        for state in states:
            overview_data["metrics"][variable][coverage][state] = []


detail_data = {}
for state in states:
    detail_data[state] = {"startYear": startYear,
                          "startMonth": startMonth,
                          "metrics": {}}
    for variable in variables_of_interest:
        detail_data[state]["metrics"][variable] = {}
        for coverage in coverages:
            detail_data[state]["metrics"][variable][coverage] = {}

test = False
verbose = False
models_built = 0
total_absolute_average_error = 0
total_mean_squared_error = 0

for state in states:
    coverage_group = state_data_group.get_group(state).groupby("COVERAGE")
    for coverage, focused_data in coverage_group:
        # Test code
        if test and models_built >= 100:
            break

        variable_models_built = 0
        X, y_data, x, undiff = time_series_to_cross_section(focused_data[variables_of_interest],
                                                            forecast_horizon=1,
                                                            max_fair_lags=2,
                                                            seasonal_factor=12)
        for variable in variables_of_interest:
            # Housekeeping variables
            models_built += 1

            # Account for time series with no variation
            state_actuals = focused_data[variable]
            std_of_actuals = state_actuals.std(ddof=1)
            if std_of_actuals == 0:
                overview_data["metrics"][variable][coverage][state] = [0]*len(state_actuals)
                detail_data[state]["metrics"][variable][coverage] = {"stddev": 0,
                                                                     "actual": list(state_actuals),
                                                                     "predicted": list(state_actuals)}
                break

            variable_models_built += 1

            # Build custom model for dataset. This is the line of code that takes all the time.
            final_model, variables_in_model = optimized_rf(X, y_data[variable],
                                                           variable_importance_n_estimators=20,
                                                           n_estimators_in_grid_search=10,
                                                           number_of_important_variables_to_use_options=[6],#, 8, 10, 12, 15, 20],
                                                           variable_importance_max_features_options=['sqrt'],#, 0.5, .75, 'auto'],
                                                           n_estimators_to_retrain_best_model=10,
                                                           verbose=False, n_random_models_to_test=1,
                                                           charts=False, n_jobs=1)

            state_predictions = undiff(final_model.oob_prediction_, variable, True)

            state_residuals = focused_data[variable] - state_predictions
            data_consumed_for_model = sum(state_residuals == 0)
            std_of_residuals = state_residuals[data_consumed_for_model:].std(ddof=1)
            state_std_residuals = state_residuals/std_of_residuals
            abs_average_error = abs((undiff(final_model.oob_prediction_, variable, True)[data_consumed_for_model:] - focused_data[variable][data_consumed_for_model:])/std_of_actuals).mean()
            MSE = (((undiff(final_model.oob_prediction_, variable, True)[data_consumed_for_model:] - focused_data[variable][data_consumed_for_model:])/std_of_actuals)**2).mean()
            total_absolute_average_error += abs_average_error
            total_mean_squared_error += MSE

            # Update primary data structures with model results
            overview_data["metrics"][variable][coverage][state] = list(state_std_residuals.values)
            detail_data[state]["metrics"][variable][coverage] = {"stddev": std_of_residuals,
                                                                 "actual": list(state_actuals),
                                                                 "predicted": list(state_predictions.round(0).astype(int))}
            if verbose:
                print "OOB R^2: %f" % final_model.oob_score_
                print "Absolute average error: %f" % abs_average_error
                print "Mean squared error: %f\n" % MSE

print total_absolute_average_error/float(models_built), total_mean_squared_error/float(models_built)
print models_built

with open('overview.json', 'w') as outfile:
    json.dump(overview_data, outfile)

with open('detail.json', 'w') as outfile:
    json.dump(detail_data, outfile,cls=NumpyAwareJSONEncoder)
