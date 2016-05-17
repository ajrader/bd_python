"""
Created on Wed Feb 25 2015
@author: AJ Rader (kesj)
aj.rader.kesj@statefarm.com

Program to run the CENT program in parallel on hadoop
"""
import os
import argparse
import subprocess
import pandas as pd
import numpy as np

#input_variables_columns = ["Reported Count", "Paid Count", "Pending Count", "Indemnity","Severity",
#                           "Suit Count", "Incurred Pure Prem", "ALAE", "CIF", "CWP","OIE_CNT"]

#variables_to_output = ["Reported Count","Paid Count", "Pending Count", "Indemnity","Severity",
#                           "Suit Count", "Incurred Pure Prem", "ALAE"]
variables_to_omit = ['CIF','CWP','OIE Count'] # per conversation with Jay Schmidt


def make_sure_path_exists(path):
    if not os.path.isdir(path):
        try:
            os.makedirs(path)
        except OSError:
            if not os.path.isdir(path):
                raise
    return


def transform_to_key_value_pairs(grouped_df,  ouput_file, output_format='json'):
    """
    A function that takes an input csv file of many timeseries data and pivots it into a key-value-pair format.
    :input grouped_df is a grouped dataframe
    :output_file is an output file
    :output_format is the output format
    TODO make this work within HDFS/streaming
    """
    import json

    #print len(voi), ofile

    dfile = ouput_file + '.' + output_format
    if output_format == 'json':
        with open(dfile, 'w') as f:
            for k in grouped_df.groups.keys():
                key = list(k)
                value = grouped_df.get_group(k)
                if not value.sum().sum() == 0:
                    line = json.dumps(key) + '\t' + value.to_json()
                    f.write(line + '\n')
    # warning following option not really working yet
    elif output_format == 'tsv':
        with open(dfile, 'w') as f:
            for k in grouped_df.groups.keys():
                key = str(list(k))
                value = grouped_df.get_group(k)
                line = key + '\t' + value.to_csv()
                f.write(line + '\n')

    return


def preprocess_cent_file(inputfile, x='STATE', y='COVERAGE', t='YEAR',
                         important_variables=[], omit_column=[], hdfs_flag=False, create_overall_variable=False):
    """
    A function that takes an input csv file of many timeseries data and processes it into the
    format that we want for CENT analysis.

    hdfs_flag indicates if the based file is in hdfs or not.

    the input parameters:
    data -- the flat 2d datashape
    important_variables -- the column name to use for the 'items' -- default is 'STATE'
    y -- the column name to use for the 'minor-axis' -- default is 'COVERAGE'
    t -- the column name to use for the 'major-axis' <- where timeseres go; default is 'YEAR'
    z -- the column title to use for 'labels' (these are the columns you can loop over)

    :returns
      my_grouped_df ( a grouped hierarchical data frame ready to be printed as key,value pairs
      important_variables ( the list of metrics used in the calculation)
      xvals (the list of the first major axis -- i.e. the states)
      yvals ( the list of the minor axis -- i.e. the coverages)
    """

    # if hdfs_flag:

    data = pd.read_csv(inputfile)
    # check format of a couple input formats. we want important_variables, omit_column to be lists

    if len(omit_column) != 0:  # omit a list of columns if so given
        data = data.drop(omit_column, axis=1, inplace=True)

    print "input dataframe has the dimensions of {0}".format(np.shape(data))
    print "the column titles are: {0}".format(data.columns)

    # check that x,y,t,variables_of_interest are in columns
    # create a set for the singletons:
    s1 = set([x, y, t])

    # create a set for all columns
    scolumns = set(data.columns.values)
    # test that s1 is subset of scolumns
    sdiff1 = s1 - scolumns
    if len(sdiff1) != 0:
        # have to fix the s1 input files
        print "We have a problem because the columns you want to pivot on are not present"
        print sdiff1, " is missing from ", scolumns
        return 0
    else:
        # convert the year to a date-time object
        data[t] = pd.to_datetime(data[t])

    if len(important_variables) == 0:  # define these based upon the input data if not defined
        important_variables = list(scolumns - s1)
        print "important variables are determined by the input data."
        # print "{0} are the important variables determined based upon the input data".format(important_variables)


        # option to generate an overall variable that is the normalized average of the other variables of interest
    if create_overall_variable:
        data['Overall'] = data.groupby([x, y]).transform(series_norm)[important_variables].sum(axis=1)
        important_variables += ['Overall']

    # generate list of unique values for the 3 input parameters: x,y,t
    print s1

    xvals = data[x].unique()
    yvals = data[y].unique()
    tvals = data[t].unique()

    print len(xvals), len(yvals), len(tvals), len(important_variables)
    # to do: check that all columns are used
    # to do: reshape the 2d data frame into a multi-index, hierarchical df
    my_grouped_data = data.groupby((x, y))  # set_index([x,y,t]
    return (my_grouped_data, important_variables, xvals, yvals)


def series_norm(series):
    """ a function that calculates the norm of a selected pandas Series
    returns the normalized series values
    """
    return (series - series.mean()) / series.std(ddof=1)


def interpolate_CENT_predictions(input_list,round_digit=2):
    """Returns list of interpolated values, round to the number of places given
       strictly assumes spacing of 1 month, 6 month and 12 month.
    """
    interpolated_predictions=[]
    forecast_1_month = input_list[0]
    forecast_6_month = input_list[1]
    forecast_12_month = input_list[2]
    # Add 1 month prediction
    interpolated_predictions.append(round(forecast_1_month,round_digit))

    # Interpolate values between 1 month and 6 months
    one_six_gap = (forecast_6_month-forecast_1_month)/5.0
    for e in range(1,5):
        interpolated_predictions.append(round(forecast_1_month+e*one_six_gap,round_digit))

    # Add 6 month prediction
    interpolated_predictions.append(round(forecast_6_month,round_digit))

    # Interpolate values between 6 months and 12 months
    six_twelve_gap = (forecast_12_month-forecast_6_month)/6.0
    for e in range(1,6):
        interpolated_predictions.append(round(forecast_6_month+e*six_twelve_gap,round_digit))

    # Add 12 month prediction
    interpolated_predictions.append(round(forecast_12_month,round_digit))
    return interpolated_predictions

def make_interpolated_forecasts(x):
    """
    function to generate the interpolated values from a list of values and errors
    :param x: list of 3 values and 3 errors in the format of [v1,e1,v2,e2,v3,e3]
    :return: series of forecasted_values and forecasted_errors for the 12 months
    assuming v1 is 1 month value, v2 is 6 month value and v3 is 12 month valaue
    """
    # if the input values are nan, just return an empty list
    if sum(np.isnan(x)) == len(x) :
        forecast_values = []
        forecast_errors = []
    else:
        values = x[::2]
        errors = x[1::2]
        forecast_values = interpolate_CENT_predictions(values)
        forecast_errors = interpolate_CENT_predictions(errors)

    return pd.Series(dict(forecast=forecast_values, std=forecast_errors))


### function to initialize API data structure containers
def initialize_CENT_api_containers(coverages, variables_of_interest, states, time_horizons, coverage_segments,
                                   start_year=2007, start_month=0):
    """
    Function for initializing the CENT api containers
    :param coverages: list of possible coverages
    :param variables_of_interest: list of variables of interest
    :param states: list of states
    :param time_horizons --> list of time horizons
    :param start_year: starting year
    :param start_month: starting month
    :return: detail_data, overview_data, and panel
    """

    # create a 4D panel data frame for the forecast data
    forecast_dimension = []
    for time in time_horizons:
        forecast_dimension.append('v'+str(time))
        forecast_dimension.append('e'+str(time))

    my_panel = pd.Panel4D(labels=states, items=coverages,major_axis=variables_of_interest,minor_axis=forecast_dimension)

    # overview_data is of the format overview_data[horizon][metric][variable][coverage][state]
    overview_data = {}
    for horizon in time_horizons:
        overview_data[horizon] = {"startYear": start_year,
                                  "startMonth": start_month,
                                  "metrics": {},
                                  "table":{}}
        for variable in variables_of_interest:
            overview_data[horizon]["metrics"][variable] = {}
            for coverage in coverages:
                overview_data[horizon]["metrics"][variable][coverage] = {}
                for state in states:
                    overview_data[horizon]["metrics"][variable][coverage][state] = []
        for segment in coverage_segments:
            overview_data[horizon]['table'][segment]={}

    # detail_data is of the format of detail_data[horizon][state]["metrics"][variable][coverage]
    detail_data = {}
    for horizon in time_horizons:
        detail_data[horizon] = {}
        for state in states:
            detail_data[horizon][state] = {"startYear": start_year,
                              "startMonth": start_month,
                              "metrics": {}}
            for variable in variables_of_interest:
                detail_data[horizon][state]["metrics"][variable] = {}
                for coverage in coverages:
                    detail_data[horizon][state]["metrics"][variable][coverage] = {}


    return (detail_data, overview_data, my_panel)

## TOP K from a dictionary
def add_value_to_dictionary(overview_dict,time_horizon,variable,coverage,joined_dictionary, index_to_add = -1):
    """
    Function to convert the overview dictionary data into a flattened_dictionary with the keys joined as a tuple.
    :param overview_dict: input dictionary of overview_data
    :param time_horizon: specific time_horizon
    :param variable: specific variable (of interest)
    :param coverage: specific coverage
    :param joined_dictionary: dictionary of flattened values of last data.
    :param index_to_add: which value to add to this flattened dictionary; default is most recent value.
    :return:
    """
    # if no input dictionary given, create one.
    if joined_dictionary == None:
        joined_dictionary = {}

    for key,value in overview_dict[time_horizon]['metrics'][variable][coverage].iteritems():
        long_key = (time_horizon,variable,coverage,key)
        try :
            value_to_add = value[index_to_add]
            joined_dictionary[long_key]=value_to_add
        except IndexError:
            #print key, " lacks values."
            # skip over cases where there are no values.
            pass
    return joined_dictionary

def return_top_bottom_K(flattened_dictionary, my_column_list = ['horizon','Variable','Coverage','State','Value'], k=10):
    """
    Function to return the top and bottom K from a flattened dictionary
    :param flattened_dictionary: flattened dictionary where the key is the 1st N-1 elements of my_column_list and the
    value is the last one.
    :param K: number of elements from top and bottom to return
    :return: table_df, a pandas data frame of the topK and bottomK results.
    """
    sorted_dictionary = sorted(flattened_dictionary, key=flattened_dictionary.get)

    # create an empty dataframe
    table_df = pd.DataFrame(data=np.zeros((0,len(my_column_list))), columns=my_column_list)

    table_size = len(table_df)
    for key in sorted_dictionary[:k]:
        key_list = [item for item in key]
        key_list.append(flattened_dictionary[key])
        table_df.loc[table_size]=key_list
        table_size+=1
        #print key_list

    for key in sorted_dictionary[-1*k:]:
        key_list = [item for item in key]
        key_list.append(flattened_dictionary[key])
        table_df.loc[table_size]=key_list
        table_size+=1
        #print key_list

    return table_df.tail(k),table_df.head(k)

def clean_up_results(streaming_output, tgtdir, detail_data, overview_data, variables_to_export,
                     my_panel, mode, time_horizon_list, segment_dict):
    """
    Function to aggregate the separate files produced by hadoop mapreduce and parse them into the desired output json
    files to be used by the web_service. Currently this involves detail.json and overview.json.
    :param streaming_output: the  streamed hadoop output.
    :param tgtdir: location (in local filespace) where this data is being dumped to.
    :param detail_data: CENT api container for the detail_data
    :param overview_data: CENT api container for the overview_data
    :param mode is whether it is R12 or MON
    :param segment_dict: a dictionary of segments (keys) and their corresponding coverages (items)
    :return:
    """
    import json
    # define local variables
    models_built = 0
    total_absolute_average_error = 0
    total_mean_squared_error = 0
    number_skipped = 0

    for sline in streaming_output.split('\n'):
        try:
            line = json.loads(sline)
        except TypeError:
            print "TypeError from\n", sline
        except ValueError:
            print "ValueError from\n", sline
            break # drop out if hit last line



        state = line['state']
        variable = line['variable']
        coverage = line['coverage']
        time_horizon = line['horizon']
        if variable in variables_to_export:
            # only consider if in the list to export.

            point_forecast=[]
            point_forecast.append(line['point_forecast']['value'])
            point_forecast.append(line['point_forecast']['std'])

            # skip over cases that were identically zero because the model had no variance or input was all zeros.
            aae = line['abs_average_error']
            mse = line['MSE']
            if not (point_forecast[1] == 0 and aae == 0 and mse == 0):
                total_absolute_average_error += aae
                total_mean_squared_error += mse
                models_built += 1
            else:
                number_skipped+=1

            # code to deal with forecast data
            value_col = 'v'+str(time_horizon)
            error_col = 'e'+str(time_horizon)
            my_panel[state][coverage].loc[variable,value_col] = point_forecast[0]
            my_panel[state][coverage].loc[variable,error_col] = point_forecast[1]

            overview_data[time_horizon]["metrics"][variable][coverage][state] = line['overview_data']
            detail_data[time_horizon][state]["metrics"][variable][coverage] = line['detail_data']


    print '********************************************************************************************'
    print total_absolute_average_error / float(models_built), total_mean_squared_error / float(models_built)
    print "{0} total models built; {1} series were skipped:".format(models_built,number_skipped)
    print '********************************************************************************************'

    # switch the ordering of the axes to match detail_data ordering
    altered_panel = my_panel.swapaxes('items','major_axis')
    for label in altered_panel.labels:
        for item in altered_panel[label].items:
            forecasted = altered_panel[label][item].apply(lambda x: make_interpolated_forecasts(x),axis=1)
            ## now output the forecast to the horizon = 1 key = 'forecast'
            for index_cov in forecasted.index:
                #append a new dictionary level for 1st time_horizon
                detail_data[1][label]['metrics'][item][index_cov]['forecast'] = {
                        'values':forecasted.ix[index_cov]['forecast'],
                        'std':forecasted.ix[index_cov]['std'] }

    # augment the overview_data with the table info for topK and bottomK tables for each coverage_segment

    states = list(my_panel.labels)
    coverages = list(my_panel.items)
    importance_variables = list(my_panel.major_axis)

    # modify this to create a table for each segment
    coverage_segments = segment_dict.keys()
    for time in time_horizon_list:
        for segment in coverage_segments:
            flattened_overview_dict = {}
            for coverage in segment_dict[segment]:
                for variable in importance_variables:
                    #for coverage in coverages:
                    flattened_overview_dict = add_value_to_dictionary(overview_data, time, variable, coverage,
                                                                  flattened_overview_dict)
            table_high_df, table_low_df = return_top_bottom_K(flattened_overview_dict)
            # append this information to overview_data
            overview_data[time]['table'][segment]['top'] = table_high_df[['Variable','Coverage','State','Value']].values.tolist()
            overview_data[time]['table'][segment]['bottom'] = table_low_df[['Variable','Coverage','State','Value']].values.tolist()

        #overview_data[time]['table'] = table_df[['Variable','Coverage','State','Value']].values.tolist()

    # check that tgtdir ends in '/'; append if not
    if not tgtdir.endswith('/'):
        tgtdir += '/'

    overview_file = tgtdir + 'overview_'+mode+'.json'
    detail_file = tgtdir + 'detail_'+mode+'.json'

    # check on existence of the directory and create it if missing
    make_sure_path_exists(tgtdir)
    with open(overview_file, 'w') as outfile:
        json.dump(overview_data, outfile)

    with open(detail_file, 'w') as outfile:
        json.dump(detail_data, outfile)

    return

def CENT_rolling_12(input_df, window_size=12):
    """
    :param df: input data frame
    :param window_size: default = 12 (number of months to make the rolling mean calculation over)
    :returns
      rolling_df ( a data frame of Rolling12 month data)
      important_variables ( the list of metrics used in the calculation)
      states (the list of the first major axis -- i.e. the states)
      coverages( the list of the minor axis -- i.e. the coverages)

    """
    # define the importance_variables
    # create a set for all columns
    columns_set = set(input_df.columns.values)
    #remove the 'STATE','COVERAGE','YEAR' columns
    default_set = set(['STATE','COVERAGE','YEAR'])
    importance_variables = list(columns_set - default_set)


    result_list_of_df = []

    grouped_df = input_df.groupby(("STATE","COVERAGE"))
    for g, df in grouped_df: # now loop over the groups and calculate rolling12 averages
        new_df = df[list(default_set)].copy()
        new_df[importance_variables] = pd.rolling_mean(df[importance_variables],window=window_size)
        result_list_of_df.append(new_df)

    rolling12_df = pd.concat(result_list_of_df)
    rolling12_df.dropna(inplace=True)
    rolling12_df['YEAR'] = pd.to_datetime(rolling12_df['YEAR'])
    states = list(rolling12_df.STATE.unique())
    coverages = list(rolling12_df.COVERAGE.unique())
    return (rolling12_df,importance_variables,states,coverages)


def main():
    from hadoop_streamer import hadoop_streamer,create_hdfs_directory
    # initialize some basic variables
    my_time_horizons = [1,6,12]
    # define the coverage_segment_dictionary
    coverage_segment_dict = {'Injury':['BI','UBI','WBI'],
                              'Property':['PD','COLL','COMP'],
                              'PIP/MPC': ['PIP','MPC']}
    # define metrics not to export
    metrics_to_drop = ['OIE Count','CIF','CWP']


    # parse the cli parameters
    parser = argparse.ArgumentParser()
    parser.add_argument('input_data_file', action="store",help='name of the input file')
    parser.add_argument("-u",'--usecase',action="store",help="name of the usecase (directory")
    parser.add_argument("-i", "--indir", help="directory for input files")
    parser.add_argument("-l","--lfs_path",help="directory for local filesystem path")
    parser.add_argument("-o", "--outpath", help="directory name for output files")
    """parser.add_argument("-v", "--verbose", help = "increase output verbosity",\
                    action="store_true")
    """
    args = parser.parse_args()
    """if args.verbose:
        print "Verbosity is turned on."
    """
    # deal with the issues of paths and file locations, both on local filesystem and hdfs
    cwd = os.getcwd()
    usecase=args.usecase
    print "Current directory is {0}. Input data file is named {1}".format(cwd, args.input_data_file)
    print "Output directory path is {0}.".format(args.outpath)

    hdfs_path = create_hdfs_directory(usecase) # establishes the HDFS location of the data
    # append the staging and derived on to this
    tgt_directories = ['/staging/','/derived/']
    tgt_modes = ['MLY','R12']

    base_file_paths = [hdfs_path + x for x in tgt_directories]
    infilename = args.input_data_file
    infile = args.indir 
    if infile is None:
        infile=cwd
    # check that tgtdir ends in '/'; append if not
    if not infile.endswith('/'):
        infile+='/'
    infile+=infilename
    # check if the input file exists
    full_infile = base_file_paths[0]+infilename
#    print "files to process are ", full_infile, infile
    rawfile_not_in_hdfs = subprocess.call(['hdfs','dfs','-ls',full_infile])

    if rawfile_not_in_hdfs: # copy from local filespace to hdfs
        subprocess.call(['hdfs', 'dfs', '-put', infile, full_infile])

    if args.lfs_path is None:
        tgt_dir = os.getcwd() #default to cwd
    else:
        tgt_dir = args.lfs_path
    # check that tgtdir ends in '/'; append if not
    if not tgt_dir.endswith('/'):
        tgt_dir+='/'

    start_year = 2007
    start_month=0


    # create an hdfs destination
    dest_path =   base_file_paths[1]+args.outpath
    subprocess.call(['hdfs','dfs', '-mkdir',dest_path])

    # now do this in a loop over the different modes of calculation (monthly and rolling12)
    for mode in tgt_modes:
        print mode
        #tgt_dir_mode = tgt_dir+mode+"/"
        # process the data separately based upon the type of mode needed
        if mode == 'MLY':
            processed_df, importance_variables, states, coverages = preprocess_cent_file(infile)
        elif mode == 'R12':
            #create the rolling12 dataframe
            raw_df = pd.read_csv(infile)
            r12_df,importance_variables,states,coverages = CENT_rolling_12(raw_df)
            #importance_variables = list(r12_df.columns[3:])
            processed_df = r12_df.groupby(('STATE','COVERAGE'))
        # find the starting year
        min_date = str(processed_df.YEAR.min().min())
        start_year = int(min_date[:4])
        start_month = int(min_date[5:7])-1
         # make sure the transformed data is in HDFS
        # -- more precisely check if the transformed data_file (json) format exists
        transformed_file = base_file_paths[0]+infilename[:infilename.rfind('.csv')]+mode+'.json' #assumes json format
        transformed_file_not_in_hdfs = subprocess.call(['hdfs','dfs','-ls',transformed_file])
        if transformed_file_not_in_hdfs: # if the transformed file doesn't exist create it
             processed_data_file = infile[:infile.rfind('.csv')]
             transform_to_key_value_pairs(processed_df, processed_data_file)
             pp_data_file = processed_data_file+'.json'
             subprocess.call(['hdfs','dfs','-put',pp_data_file,transformed_file])

        # define the intermediate directory
        tpath = base_file_paths[0]+args.outpath+'/'+mode
        if subprocess.call(['hdfs','dfs','-ls',tpath]):
            subprocess.call(['hdfs','dfs','-mkdir', 'tpath'])

        print "working in this directory: ", tpath

        # Run the Hadoop Streaming MapReduce job
        out = hadoop_streamer(mapper='triplicate.py',
                              reducer='build_models3.py',
                              input_file=transformed_file,
                              outpath=tpath,
                              files=['mltimeseries.py',
                                 '/usr/lib/vmware-tools/lib/libXrender.so.1/libXrender.so.1',
                                 # Required for matplotlib.pyplot
                                 '/usr/lib/vmware-tools/lib/libXau.so.6/libXau.so.6'],  # Required for matplotlib.pyplot
                              options='-D mapreduce.job.reduces=100')

        # clean_up results
        # initialize the API data structures
        # restrict the variables to output to be difference of importance_variables and metrics_to_drop
        variables_to_export = list(set(importance_variables) - set(metrics_to_drop))

        detail_data, overview_data, forecast_panel = initialize_CENT_api_containers(coverages, variables_to_export,
                                                                          states, my_time_horizons, coverage_segment_dict.keys(),
                                                                          start_year, start_month)
        clean_up_results(out, tgt_dir, detail_data, overview_data, variables_to_export,
                         forecast_panel, mode, my_time_horizons, coverage_segment_dict)

    # push the results back to hdfs


    #dest_path =   base_file_paths[1]+args.outpath
    agg_files = tgt_dir
    print "local directory files", agg_files
    print " destination_ files",dest_path

    push_to_hdfs_cmd = ['hdfs', 'dfs','-put',agg_files,dest_path]
    subprocess.call(push_to_hdfs_cmd)


    # remove the files in local filespace
    remove_local_files_flag = False#True
    if remove_local_files_flag:
        subprocess.call(['rm','-r',agg_files])




if __name__ == '__main__':
    main()
