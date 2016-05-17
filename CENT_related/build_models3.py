#!/opt/anaconda/latest/bin/python
import os
import sys
sys.path.append(os.getcwd())

from mltimeseries import time_series_to_cross_section, optimized_rf,model_forecast
import json
import pandas as pd
import numpy as np

# define a dictionary of rounding_digits based upon the variables of interest
#variables_of_interest = ["Reported Count", "Paid Count", "Pending Count", "Indemnity", "Severity", "Overall"]
variables_of_interest = ["Reported Count", "Paid Count", "Pending Count", "Indemnity", "Severity", "ALAE","Suit Count",
                         "Incurred Pure Prem", "CIF", "CWP","OIE Count"]
#                         "Incurred Pure Prem"]
#variables_for_modeling = ["Reported Count", "Paid Count", "Pending Count", "Indemnity", "Severity", "ALAE","Suit Count",



from collections import defaultdict
rnd_digits = defaultdict(int)
for v in variables_of_interest:
    if v.endswith('Count'):
        rnd_digits[v]=0
    elif v.endswith('CNT'):
        rnd_digits[v]=0
    else:
        rnd_digits[v]=2

for line in sys.stdin:
    key, value = line.strip().split('\t')
    state, coverage,time_horizon = json.loads(key)
    focused_data = pd.read_json(value)
    #AJR 3.25.15 correct for json IO formating issues: sort on index and convert to integers
    focused_data.sort_index(inplace=True)
    new_index = map(int, focused_data.index)
    focused_data = focused_data.reindex(new_index)
    
    X, y_data, x, undiff = time_series_to_cross_section(focused_data[variables_of_interest],
                                                        forecast_horizon=time_horizon,
                                                        max_fair_lags=13,
                                                        seasonal_factor=12)
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
                                      "predicted": list(state_actuals) },
                      'abs_average_error': 0,
                      'MSE': 0,
                      'point_forecast': {"value": 0, "std": 0}}
            print json.dumps(output)
            continue

        # Build custom model for dataset. This is the line of code that takes all the time.
        final_model, variables_in_model = optimized_rf(X, y_data[variable],
                                                       variable_importance_n_estimators=120,
                                                       n_estimators_in_grid_search=50,
                                                       number_of_important_variables_to_use_options=[6,8,10,12,15,20],#[6],#, 8, 10, 12, 15, 20],
                                                       variable_importance_max_features_options=['sqrt'],#, 0.5, .75, 'auto'],
                                                       n_estimators_to_retrain_best_model=200,
                                                       verbose=False, n_random_models_to_test=6,
                                                       charts=False, n_jobs=1)



        state_predictions = undiff(final_model.oob_prediction_, variable, True)

        state_residuals = focused_data[variable] - state_predictions
        data_consumed_for_model = sum(state_residuals == 0)
        std_of_residuals = state_residuals[data_consumed_for_model:].std(ddof=1)
        # Zero out models where there is tiny variance (i.e. the
        if (np.isnan(std_of_residuals) or std_of_residuals == 0):
            state_std_residuals= state_residuals
            std_of_residuals = 0
            abs_average_error = 0
            MSE = 0
        else:
            state_std_residuals = state_residuals/std_of_residuals
            abs_average_error = abs((undiff(final_model.oob_prediction_, variable, True)[data_consumed_for_model:] - focused_data[variable][data_consumed_for_model:])/std_of_actuals).mean()
            MSE = (((undiff(final_model.oob_prediction_, variable, True)[data_consumed_for_model:] - focused_data[variable][data_consumed_for_model:])/std_of_actuals)**2).mean()


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
                                  "predicted": state_predictions},
                  'abs_average_error': round(abs_average_error,5),
                  'MSE': round(MSE,5),
                  'point_forecast': {"value": round(forecast,5), "std": round(std_of_residuals,5)}}

        print json.dumps(output)
