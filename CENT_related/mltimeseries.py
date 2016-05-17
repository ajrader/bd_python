import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import matplotlib.pyplot as plt

def number_of_nulls(series):
    return series.isnull().sum()

def are_the_last_n_values_null(series, n):
    """
    series: A selection of a pandas dataframe
    n: If the last n values are null, returns True
    """
    number_of_null_values = number_of_nulls(series)
    return number_of_null_values == series[-number_of_null_values:].isnull().sum()

def n_of_missing_last_values(series):
    number_of_null_values = number_of_nulls(series)
    if number_of_null_values == 0:
        return 0
    while True:
        if are_the_last_n_values_null(series, number_of_null_values):
            return number_of_null_values
        number_of_null_values -= 1
        if number_of_null_values < 0:
            return "Error"
        
def missing_last_values(df):
    """Returns a Series of each variable with
    the number of missing values at the end
    """
    missing_last_values_df = pd.Series()
    for variable in df.columns:
        missing_last_values_df[variable] = n_of_missing_last_values(df[variable])
    return missing_last_values_df

def make_lag(series, n_lag):
    """OLD VERSION. Returns a series with specified lag"""
    original_index = series.index
    series = series[:-n_lag]
    series.index = original_index[n_lag:]
    series = series.reindex(original_index)
    return series

# def make_lag(series, n_lag):
#     """Returns a series with specified lag"""
#     # Update index
#     max_index_value = series.index[-1]
#     index_to_add = ["t%d"%(e+1) for e in xrange(n_lag)]
#     new_index = np.concatenate([series.index, index_to_add])
    
#     # Update values
#     values_to_add = [np.nan]*n_lag
#     new_values = np.concatenate([values_to_add, series.values])
    
#     return pd.Series(new_values, new_index)

def difference_data(df, diff=1):
    """
    df: pandas df
        Must be sorted with the most recent data at the bottom of the 
        dataframe
        
    diff: integer
        Default of 1 implies first difference. If 2, it will be a second 
        difference
    """        
    data_old = df.copy()
    df = df[:-diff]
    df.index = data_old.index[diff:]
    df = df.reindex(data_old.index)
    return data_old - df

def time_series_to_cross_section(df, forecast_horizon=1, 
                                 difference=True, 
                                 max_fair_lags=4, seasonal_factor=None):
    """
    df: pandas df or path to csv file
        There should be no missing values within the series. Missing
        values at the end or beginning of the series are okay.
    
    forecast_horizon: integer
        Specifies how far ahead to make the forecast from the most
        recent NON-NULL value.
        
    difference: boolean
        If True, all the data is differenced at the forecast_horizon.
        For example, if the forecast horizon is 6, then t0 will be
        subtracted from t6. The reason for this is if we forecast the 
        simple difference (t1 - t0), we will not be able to
        undifference it.
        
    max_fair_lags: integer
        Will use up to max_fair_lags lags of data. If you enter 6 lags
        and the last 4 data points of a series are missing, only
        lag 6 will be included (lag 5 is only fair to predict the 
        most recent y value)
        
    seasonal_factor: integer
        Adds a column to the dataset that is 0, 1, ... , 
        seasonal_factor-1 repeating.
        
    Returns:
    output_df: pandas df
        A fair design matrix to use to predict any of the columns of
        the output_y_df
        
    output_y_df: pandas df
        Contains a df with fair y values to use for every column in 
        the df. Simply select the column data and use it as y in any
        ML algorithm paired with the output_df as X.
        
    x_to_predict: pandas series
        Once you build your model and want to predict the next point,
        use this data in the predict method of the model. This point 
        will correspond to the forecast horizon relative to the most 
        recent valid data point.
        
    undiff_x_predict_function: function
        The predict series of the model will return the expected change
        and not the absolute value of the prediction. Use this function
        to undifference the prediction. The input is the differenced
        prediction and the column name.
    """
    # Create a df that specifies the most recent fair lag
    # that can be used for each column
    missing_last_values_df = missing_last_values(df)
    most_recent_fair_lag = missing_last_values_df + forecast_horizon
    
    # Specify output dataframe
    output_df = pd.DataFrame()
    
    # Add all fair lags to dataframe
    for var in df.columns:
        min_lag = most_recent_fair_lag[var]
        # print var, min_lag, max_fair_lags
        while min_lag <= max_fair_lags:
            output_df["%s_lag%d" % (var, min_lag)] = make_lag(df[var], 
                                                              min_lag)
            min_lag += 1
    
    # Differenced design matrix
    if difference:
        output_df = difference_data(output_df, forecast_horizon)
    
    # Drop rows with NaN
    output_df.dropna(inplace=True)

    # Align df of y values so that it is fair for each variable
    output_y_df = df.copy()
    for var in df.columns:
        recent_missing = missing_last_values_df[var]
        if recent_missing > 0:
            output_y_df[var] = np.concatenate([list([np.nan])*recent_missing, 
                                              output_y_df[var][:-recent_missing]])
    
    if difference:
        undiff_output_y_df = output_y_df.copy()
        output_y_df = difference_data(output_y_df, forecast_horizon)
        output_y_df = output_y_df[forecast_horizon:]
        
    # Calculate number of rows to drop from output_y_df
    rows_to_drop = output_y_df.shape[0] - output_df.shape[0] + forecast_horizon # Adjusts for t1-tn
    output_y_df = output_y_df[rows_to_drop:]
    
    # Add seasonal factor
    if seasonal_factor:
        output_df["seasonality"] = np.array(range(seasonal_factor)*(output_df.shape[0]/seasonal_factor+1))[:output_df.shape[0]]
    
    # Copy the last line as the x to predict
    x_to_predict = pd.Series(output_df[-1:].values[0], index=output_df.columns)
    
    # Drop the last rows of output_df
    output_df = output_df[:-forecast_horizon]
    
    # Make function that undifferences the data
    def undifference(differenced_data, column_name, include_initial_points=False):
        """
        Undifferences either the in-sample predictions or the 
        out-of-sample prediction.
        
        differenced_data: pandas dataframe or pandas series
        If dataframe, the column_name must be the same between the original 
        dataset and the original data. If series, it doesn't matter
        
        column_name: string
        The name of the column to undifference
        
        include_initial_points: Boolean, optional (default=False)
        If True, would prepend the series with the actual values. These
        values should not be considered to be fair predictions.
        
        Returns
        Undifferenced series or point.
        """
        original_series = df[column_name].values
        
        # If only a single data point is provided, return single 
        # undifferenced value
        try:
            differenced_data = float(differenced_data)
        except TypeError:
            pass
        
        if type(differenced_data) in [int, float] or len(differenced_data) == 1:
            if type(differenced_data) == list:
                differenced_data = differenced_data[0]
            return original_series[-1] + differenced_data
        
        if len(differenced_data.shape) == 2:
            differenced_data = differenced_data[column_name]
        len_of_differenced_data = differenced_data.shape[0]
        len_of_original_series = original_series.shape[0]
        size_diff = len_of_original_series - len_of_differenced_data
        
        # Drop rows that were removed due to lags
        new_series = original_series[(size_diff - forecast_horizon):-forecast_horizon]
        
        undifferenced_series = new_series + differenced_data
        
        if include_initial_points:
            undifferenced_series = np.concatenate((original_series[:size_diff], undifferenced_series), 
                                                  axis=0)
        return undifferenced_series
    
    return output_df, output_y_df, x_to_predict, undifference
    
    
def sort_variables_by_importance(X, y, n_estimators=100, 
                                 max_features="auto", chart=True,
                                 random_state=42, n_jobs=1):
    """Returns an array of column names sorted by rf importance"""
    model = RandomForestRegressor(n_estimators, 
                                  max_features=max_features, 
                                  random_state=random_state, 
                                  n_jobs=n_jobs)
    model.fit(X, y)
    important_variables = pd.Series(model.feature_importances_, 
                                    index=X.columns)
    important_variables.sort()
    if chart:
        important_variables.plot(kind="barh", figsize=(5,15))
        plt.show()
    important_variables.sort(ascending=False)
    return list(important_variables.index)


def oob_randomized_rf_gridsearch(X, y, n_estimators=50, 
                                 n_models_to_test=10, 
                                 top_models_to_print=3, 
                                 trees_in_final_model="auto",
                                 verbose=True, 
                                 random_state=42, 
                                 n_jobs=1):
    """
    Performs a simple randomized gridsearch using the oob_errors.
    
    Parameters
    ----------
    X: pandas df
    
    y: pandas Series
    
    n_estimators: int, optional (default=50)
    Number of trees in random forest
    
    n_models_to_test: int, optional (default=10)
    Number of unique parameter combinations to test
    
    top_models_to_print: int, optional (default=3)
    Prints the parameter list of the top models selected
    
    trees_in_final_model: int,  "auto", or None, optional (default="auto")
    After finding the optimal model, retrains model with this many
    trees. If "auto", is equal to n_estimators * n_models_to_test/2.
    If None, doesn't train final model. Returns trained model list 
    instead.
    
    verbose: Boolean, optional (default=True)
    Prints final trained model stats if True
    
    Returns 
    -------
    Final trained model
    """
    max_features_options = [.1, "sqrt", .25, .5, .75, 1.0]
    min_samples_split_options = [2, 4, 6]
    min_samples_leaf_options = [1, 2, 3]
    
    max_trials = len(max_features_options)*len(min_samples_split_options)*len(min_samples_leaf_options)
    if n_models_to_test >= max_trials:
        print "Too many trials, n_models_to_test set to", max_trials - 1
        n_models_to_test = max_trials - 1
    
    def get_parameters():
        max_features = np.random.choice(max_features_options, 1, p=[.2, .1, .1, .1, .1, .4])[0]
        if max_features != "sqrt":
            max_features = float(max_features)
        min_samples_split = np.random.choice(min_samples_split_options, 1, p=[.7, .2, .1])[0]
        min_samples_leaf = np.random.choice(min_samples_leaf_options, 1, p=[.7, .2, .1])[0]
        return max_features, min_samples_split, min_samples_leaf
    
    parameters_tested = []
    model_results = []
    for trial in xrange(n_models_to_test):
        # Ensure only unique parameter combinations are tested
        while True:
            max_features, min_samples_split, min_samples_leaf = get_parameters()
            if (max_features, min_samples_split, min_samples_leaf) not in parameters_tested:
                parameters_tested += [(max_features, min_samples_split, min_samples_leaf)]
                break

        model = RandomForestRegressor(n_estimators=n_estimators, max_features=max_features, 
                                      min_samples_split=min_samples_split, 
                                      min_samples_leaf=min_samples_leaf, oob_score=True,
                                      random_state=random_state, n_jobs=n_jobs)
        try:
            model.fit(X, y)
            model_specs = zip(["max_features", "min_samples_split", "min_samples_leaf"], 
                              (max_features, min_samples_split, min_samples_leaf))
            model_results += [(round(model.oob_score_,4), model_specs)]
        except ValueError:
            pass
        
    model_results.sort(reverse=True)
    
    if top_models_to_print:
        pprint(model_results[:top_models_to_print])
        
    if trees_in_final_model:
        if trees_in_final_model == "auto":
            trees_in_final_model = int(n_estimators*n_models_to_test/2.0)
            
        top_model = model_results[0][1]
        max_features, min_samples_split, min_samples_leaf = [e[1] for e in top_model]
        model = RandomForestRegressor(n_estimators=trees_in_final_model, 
                                      max_features=max_features, 
                                      min_samples_split=min_samples_split, 
                                      min_samples_leaf=min_samples_leaf, 
                                      oob_score=True,
                                      random_state=random_state, 
                                      n_jobs=n_jobs)
        model.fit(X, y)
        if verbose:
            print ""
            print "Final model results"
            print (round(model.oob_score_,4), top_model)
        return model
    else:
        return model_results
    
    return None
  
def optimized_rf(X, y, variable_importance_n_estimators=100, 
                 variable_importance_max_features_options=["sqrt", .5, "auto"],
                 number_of_important_variables_to_use_options=[8, 10, 12, 15],
                 n_estimators_in_grid_search=50,
                 n_estimators_to_retrain_best_model=100,
                 n_random_models_to_test=15,
                 verbose=True,
                 charts=False,
                 random_state=42,
                 n_jobs=1):
    """
    Auto optimize the RF oob R^2 using a randomized search
    
    Returns
    -------
    Optimized model, variables_in_model
    """
    np.random.seed(seed=random_state)
    best_model_score = -100
    
    for max_features in variable_importance_max_features_options:
        if verbose:
            print
            print "*"*60
            print "Variable importance optimization max features:", max_features
            print "*"*60
        important_variables = sort_variables_by_importance(X, y, 
                                                           n_estimators=variable_importance_n_estimators, 
                                                           max_features=max_features, 
                                                           chart=charts)

        for n_important_variables_to_use in number_of_important_variables_to_use_options:
            if n_important_variables_to_use > len(X.columns):
                break
            var_to_use = important_variables[:n_important_variables_to_use]
            model = oob_randomized_rf_gridsearch(X[var_to_use], y, 
                                                 n_estimators=n_estimators_in_grid_search, 
                                                 n_models_to_test=n_random_models_to_test, 
                                                 top_models_to_print=None, 
                                                 trees_in_final_model=n_estimators_to_retrain_best_model,
                                                 verbose=verbose, 
                                                 n_jobs=n_jobs)
            if model.oob_score_ > best_model_score:
                best_model = model
                best_var_importance_max_features = max_features
                variables_in_model = var_to_use
                best_model_score = model.oob_score_
    return best_model, variables_in_model

def model_forecast(x_to_predict,variable, mdl,mdl_vars, undiff):
    """

    :param x_to_predict: This is the x value for the given point in the future to predict
    :param variable: the current variable (metric) of interest to forcast ahead
    :param mdl: the optimized model returned for a given series and horizon
    :param mdl_vars: the corresponding variables used in that model
    :param undiff: the function used to transform from differenced to absolute values
    :return: the point prediciton (forecast) corresponding to the associated future time point.
    """
    raw_predict = mdl.predict(x_to_predict[mdl_vars])
    forecast = undiff(raw_predict, variable, True)
    return forecast