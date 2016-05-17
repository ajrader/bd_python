#!/opt/anaconda/latest/bin/python
import os
import sys
sys.path.append(os.getcwd())

from mltimeseries import time_series_to_cross_section, optimized_rf,model_forecast
import json
import pandas as pd

# define a dictionary of rounding_digits based upon the variables of interest
variables_of_interest = ["Reported Count", "Paid Count", "Pending Count", "Indemnity", "Severity", "Overall"]
from collections import defaultdict
rnd_digits = defaultdict(int)
for v in variables_of_interest:
    if v.endswith('Count'):
        rnd_digits[v]=0
    else:
        rnd_digits[v]=2

time_horizon_list = [1,6,12]
for line in sys.stdin:
    key, value = line.strip().split('\t')
    state, coverage = json.loads(key)
    focused_data = pd.read_json(value)


    # try creating a list of these variables

    #for time_horizon in time_horizon_list:
    X, y_data, x, undiff = time_series_to_cross_section(focused_data[variables_of_interest],
                                                        forecast_horizon=1,
                                                        max_fair_lags=13,
                                                        seasonal_factor=12)
    X6, y_data6, x6, undiff6 = time_series_to_cross_section(focused_data[variables_of_interest],
                                                        forecast_horizon=6,
                                                        max_fair_lags=13,
                                                        seasonal_factor=12)

    X12, y_data12, x12, undiff12 = time_series_to_cross_section(focused_data[variables_of_interest],
                                                        forecast_horizon=12,
                                                        max_fair_lags=13,
                                                        seasonal_factor=12)


    time_horizon=1
    for variable in variables_of_interest:
        # Account for time series with no variation
        state_actuals = focused_data[variable]
        std_of_actuals = state_actuals.std(ddof=1)
        if std_of_actuals == 0:
            output = {'horizon': time_horizon,
                      'state': state,
                      'variable': variable,
                      'coverage': coverage,
                      'overview_data': [0]*len(state_actuals),
                      'detail_data': {"stddev": 0,
                                      "actual": list(state_actuals),
                                      "predicted": list(state_actuals),
                                      "point_forecast": 0},
                      'abs_average_error': 0,
                      'MSE': 0}
            print json.dumps(output)
        #    break
        else:
            #define the number of variables based upon the horizon size:

            # Build custom model for dataset. This is the line of code that takes all the time.
            final_model, variables_in_model = optimized_rf(X, y_data[variable],
                                                       variable_importance_n_estimators=120,
                                                       n_estimators_in_grid_search=50,
                                                       number_of_important_variables_to_use_options=[6,8,12,15,20],#[6],#, 8, 10, 12, 15, 20],
                                                       variable_importance_max_features_options=['sqrt'],#, 0.5, .75, 'auto'],
                                                       n_estimators_to_retrain_best_model=200,
                                                       verbose=False, n_random_models_to_test=6,
                                                       charts=False, n_jobs=1)
    #        state_predictions = state_actuals
            state_predictions = undiff(final_model.oob_prediction_, variable, True)
            state_residuals = focused_data[variable] - state_predictions

            data_consumed_for_model = sum(state_residuals == 0)
            std_of_residuals = state_residuals[data_consumed_for_model:].std(ddof=1)
            state_std_residuals = state_residuals/std_of_residuals
            abs_average_error = abs((undiff(final_model.oob_prediction_, variable, True)[data_consumed_for_model:]
                                         - focused_data[variable][data_consumed_for_model:])/std_of_actuals).mean()
            MSE = (((undiff(final_model.oob_prediction_, variable, True)[data_consumed_for_model:]
                         - focused_data[variable][data_consumed_for_model:])/std_of_actuals)**2).mean()

            #  point forecast for this variable and time horizon
            forecast = model_forecast(x,variable, final_model, variables_in_model,undiff)
            #convert list of values to 2 floating point digits or 0 for counts
            rnd_size = rnd_digits[variable]
            if rnd_size > 0 :
                state_actuals = [ round(elem,rnd_size) for elem in list(state_actuals)]
                state_predictions = [ round(elem,rnd_size) for elem in list(state_predictions)]
            else:
                state_actuals = [ int(round(elem,0)) for elem in list(state_actuals)]
                state_predictions = [ int(round(elem,0)) for elem in list(state_predictions)]

            overview_values = [round(elem,2) for elem in list(state_std_residuals.values)]
            output = {'horizon': time_horizon,
                          'state': state,
                  'variable': variable,
                  'coverage': coverage,
                  'overview_data': overview_values,#list(state_std_residuals.values),
                  'detail_data': {"stddev": round(std_of_residuals,5),
                                  "actual": state_actuals,
                                  "predicted": state_predictions,
                                  "point_forecast": forecast},#list(state_predictions.round(0).astype(int))},
                  'abs_average_error': round(abs_average_error,5),
                  'MSE': round(MSE,5)}

            print json.dumps(output)