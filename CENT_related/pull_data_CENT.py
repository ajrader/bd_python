# Ask for login info
# Query database
# Munge data into desired form
# AJR 03.02.2015
# function to convert the data files provided in tsv format into a usable format for the hadoop streamer.

import pandas as pd
import os
import argparse
import subprocess
import sys
import numpy as np
from collections import defaultdict

# static dictionaries
state_dictionary = { '01':'AL', '02':'AK', '03':'AZ', '04':'AR', '05':'CA', '06':'CO', '07':'CT', '08':'DE', '09':'DC',
             '11':'GA', '12':'ID', '13':'IL', '14':'IN', '15':'IA', '16':'KS', '17':'KY', '18':'LA', '19':'ME',
             '20':'MD', '22':'MI', '23':'MN', '24':'MS', '25':'MO', '26':'MT', '27':'NE', '28':'NV', '29':'NH',
             '30':'NJ', '31':'NM', '32':'NY', '33':'NC', '34':'ND', '35':'OH', '36':'OK', '37':'OR', '38':'PA',
             '40':'SC', '41':'SD', '42':'TN', '43':'TX', '44':'UT', '45':'VT', '46':'VA', '47':'WA', '48':'WV',
             '49':'WI', '50':'WY', '51':'HI', '52':'NY', '53':'TX', '55':'CA', '59':'FL', '75':'CA',
             '21':'MA', '39':'RI',
             '94':'TX','96':'CA','97':'NY'}

state_name_dictionary = {'01': 'ALABAMA', '02': 'ALASKA', '03':'ARIZONA','04':'ARKANSAS','06':'COLORADO',
                  '07':'CONNECTICUT','08' : 'DELAWARE','09':'DIST. OF COL.','11':'GEORGIA','12':'IDAHO',
#when state = '05' then 'CALIF N COAST'
                  '13':'ILLINOIS','14':'INDIANA','15':'IOWA','16':'KANSAS','17':'KENTUCKY',
                  '18': 'LOUISIANA','19' : 'MAINE','20' : 'MARYLAND','21' : 'MASSACHUSETTS','22' : 'MICHIGAN',
                  '23' : 'MINNESOTA','24' : 'MISSISSIPPI','25':'MISSOURI','26' :'MONTANA',
                  '27':'NEBRASKA','28':'NEVADA','29':'NEW HAMPSHIRE','30':'NEW JERSEY','31':'NEW MEXICO',
                  #'32':'NEW YORK METRO'
                  '33':'NORTH CAROLINA','34':'NORTH DAKOTA','35':'OHIO','36':'OKLAHOMA','37':'OREGON',
                  '38':'PENNSYLVANIA','39':'RHODE ISLAND','40':'SOUTH CAROLINA','41':'SOUTH DAKOTA','42':'TENNESSEE',
                  #'43':'TEXAS NO.'
                  '44':'UTAH','45':'VERMONT','46':'VIRGINIA','47':'WASHINGTON','48':'WEST VIRGINIA',
                  '49':'WISCONSIN','50':'WYOMING','51':'HAWAII',              #'52':'NEW YORK HERIT'
                  #'53':'TEXAS SO.'           #'55':'CALIF. GR.'
                  '59':'FLORIDA',#'95':'FLORIDA',
                  '94':'TEXAS','96':'CALIFORNIA','97':'NEW YORK'}
                    #'75':'CALIF S COAST' }

#create a dictionary listing which states are in which type of coverage: PIP, MPC or both
# list of pip/mpc/both
#pip_coverage_map = defaultdict(list)
"""
#TODO change these lists to use 2 letter abbreviation
both_state_list =['FL','MA','TX','VA']
mpc_state_list = ['AL','AK','AZ','AK','CA','CO','CT','GA','ID','IL',
                  'IN','IA','LA','ME','MI','MO','MT','NE','NV','NH',
                  'NM','NC','OH','OK','RI','SD','TN','VT','WV','WI',
                  'WY']
pip_state_list = ['DE','DC','HI','KS','KY','MD','MI','MN','NJ','NY',
                  'ND','OR','PA','SC','UT','WA']

"""
both_state_list = ['FLORIDA','MASSACHUSETTS','TEXAS','VIRGINIA']
mpc_state_list = ['ALABAMA', 'ALASKA', 'ARIZONA', 'ARKANSAS', 'CALIFORNIA',
                  'COLORADO', 'CONNECTICUT', 'GEORGIA', 'IDAHO', 'ILLINOIS',
                  'INDIANA','IOWA', 'LOUISIANA', 'MAINE', 'MISSISSIPPI',
                  'MISSOURI', 'MONTANA', 'NEBRASKA', 'NEVADA', 'NEW HAMPSHIRE',
                  'NEW MEXICO', 'NORTH CAROLINA', 'OHIO', 'OKLAHOMA', 'RHODE ISLAND',
                  'SOUTH DAKOTA', 'TENNESSEE', 'VERMONT', 'WEST VIRGINIA', 'WISCONSIN',
                  'WYOMING']
pip_state_list = [ 'DELAWARE', 'DIST. OF COL.', 'HAWAII', 'KANSAS', 'KENTUCKY',
                   'MARYLAND', 'MICHIGAN', 'MINNESOTA', 'NEW JERSEY', 'NEW YORK',
                   'NORTH DAKOTA', 'OREGON', 'PENNSYLVANIA', 'SOUTH CAROLINA', 'UTAH',
                    'WASHINGTON']

def zero_missing_coverage(df,coverage,states_list,
                          cols_to_zero=None):

    #                      ['REPORTED_CNT','PAID_CNT','PENDING_CNT','CWP','OIE_CNT','SUIT_CNT','PD_AMT','ALAE']):
    """
    Function to apply zeroing logic to states that lack a certain type of coverage
    :param df: input data frame of losses
    :param coverage: the name of the coverage to zero out
    :param states_list: List of states that contain the other type of coverage in that class, i.e. the list of
            states that lack the type of coverage to zero out
    :param cols_to_zero: list of columns to zero out
    :return:
    """
    if cols_to_zero == None:
        # by default zero all the columns associated with metrics
        scolumns = set(df.columns) #
        s1 = set(['STATE','date','COVERAGE'])
        cols_to_zero = list(scolumns - s1)
        
    zero_index = df[(df.COVERAGE==coverage)&df.STATE.isin(states_list)].index
    df.loc[zero_index,cols_to_zero]=0
    return df

def return_summed_coverages(df,coverage_list,coverage_name):
    """
    function to sum and group the coverages in a data frame based upon combined coverages

    :return: data frame with added combined coverages
    """
    new_df = df[df.COVERAGE.isin(coverage_list)].groupby(('STATE','YEAR'),as_index=False).sum()
    new_df['COVERAGE']=coverage_name
    return new_df

def calc_pure_premium(df,window_size=12):
    pure_prem_df = pd.DataFrame()
    gdf = df.groupby(('STATE','COVERAGE'))
    for g, group_df in gdf:
        r12_cif = pd.rolling_mean(group_df['CIF'],window=window_size)
        pure_prem = (group_df['Paid Count']+group_df['Pending Count'].diff())/r12_cif * group_df['Severity']
        group_df = pd.concat([group_df,pure_prem],axis=1)
        group_df.rename(columns={0: 'Incurred Pure Prem'},inplace=True)
        pure_prem_df=pd.concat([pure_prem_df,group_df],axis=0)

    return pure_prem_df



def main():
    # parse the cli parameters
    from glob import glob
    import re
    parser = argparse.ArgumentParser()
    parser.add_argument('-i','--input_path',action="store",help="name of the input directory path")
    parser.add_argument('-o',"--output_path", action="store",help="name of the output directory path")
    parser.add_argument('-n',"--name",action="store",help="name to add to the output file, try the in MM_YYYY format.")
    parser.add_argument('-e','--extension',action='store',help="file extension.",default='.XCN')
    args = parser.parse_args()



    # If these input parameters are not given use the current working directory
    cwd = os.getcwd()
    inpath = args.input_path
    outpath = args.output_path
    if inpath is None:
        inpath=cwd
    if outpath is None:
        outpath = cwd

    if cwd != inpath:
        os.chdir(inpath)

    print "Current directory is {0}. Input data path is named {1}".format(cwd, inpath)
    print "Output directory path is {0}.".format(outpath)
    # create the output file name

    if args.name is None:
        import time
        current_month = time.localtime().tm_mon
        current_year = time.strftime('%Y') # just get the month_year
        previous_month = current_month -1
        if previous_month == 0:
            previous_month = 12
            current_year = str(int(current_year)-1)
        previous_month = str(previous_month)
        if len(previous_month)==1:
            previous_month='0'+previous_month

        current_month_year = previous_month+'_'+current_year
        #assume a one-month lag
    else:
        current_month_year = args.name



    out_file_name = 'base3_CENT_'+current_month_year+'.csv'

    # parse the meta-data documentation file
    field_documentation_file = 'Field Documentation within Files.txt'
    ## process the meta-data as column headers
    meta_line = []
    # make sure that the first file deals with documentation.
    if 'Documentation' not in field_documentation_file:
        sys.exit("Could not find the correct documentation file for meta data.")

    with open(field_documentation_file) as infile:
        for line in infile:
            if len(line)>1:
                line=line.strip('\n')
                tline = re.sub("     ", "\t", line)
                elements = tline.split('\t')
                elements = [x.strip() for x in elements]
                meta_line.append(elements)

    # now process these meta_line values
<<<<<<< HEAD
    print "meta_line: ", meta_line
=======
>>>>>>> 9c84c7a6bbbfa38591595300703e865f0418e06c
    meta_names = defaultdict(list)
    for row in meta_line[1:]:
        if len(row)==1:
            infile_names = row[0].split(' File')[:-1]
            infile_names = [x.strip() for x in infile_names]
<<<<<<< HEAD
            #print infile_names
=======
>>>>>>> 9c84c7a6bbbfa38591595300703e865f0418e06c
        elif len(row)==3:
            for j in xrange(0,3):
                meta_names[infile_names[j]].append(row[j])
        elif len(row)>3:
            if len(row[0]):
                meta_names[infile_names[0]].append(row[0])
            meta_names[infile_names[2]].append(row[-1])

    # Read in the raw data files
    file_list = glob('*'+args.extension)

    ## so these are the headers for each of the next set of files
    input_df = [] # list of dataframes for each of these files.
    file_key_list = ['CIF','PIF','Loss']
    for f in file_list:
        # convert to dict_key
        """        my_key = f[11:14] # worked on old data (pre Steve Roberson)
        if my_key == 'Los':
            my_key = 'Loss'
        """
        # new approach (Sept. 2015) to be more generic
        if file_key_list[0] in f:
            my_key = file_key_list[0]
        elif file_key_list[1] in f:
            my_key = file_key_list[1]
        elif file_key_list[2] in f:
            my_key = file_key_list[2]
        else:
            break
        print "opening file {0} with {1} columns".format(f, len(meta_names[my_key]))
        ## now open that file using pandas
        #input_df.append(pd.read_csv(f,header=None,sep='~',names=meta_names[my_key]))
        input_df.append(pd.read_csv(f,sep='~'))

    #print [df.shape for df in input_df]

    #now clean up these dataframes (one point is that more info is provided than we currently use.
    #begin by condensing the name values in the LINE & Coverage columns
    ## create a dictionary for each
    uniq_line_name_dict = {}
    uniq_coverage_name_dict = {}
    for adf in input_df:
        uline_names = list(adf.LINE.unique())
        if 'COVERAGE' in list(adf.columns):
            ucoverage_names = list(adf.COVERAGE.unique())
            for y in ucoverage_names:
                uniq_coverage_name_dict[y] = y.strip()

        for x in uline_names:
            uniq_line_name_dict[x]= x.strip()

    #Use These dictionaries to replace the values in each dataframe and combine the YEAR+MONTH into a new datetime
    # column based upon the beginning of the month.
    for i in xrange(0,len(input_df)):
        input_df[i].replace(to_replace=uniq_line_name_dict,inplace=True)
        if 'COVERAGE' in list(input_df[i].columns):
            input_df[i].replace(to_replace=uniq_coverage_name_dict,inplace=True)
        #combine YEAR+MONTH into one column called 'date'
        input_df[i]['date'] =input_df[i][['MONTH','YEAR']].apply(lambda x: pd.to_datetime(
            "-".join(map(str,x)),format='%m-%Y'),axis=1)
        ## now drop the MONTH & YEAR columns
        input_df[i].drop(['YEAR','MONTH'],axis=1,inplace=True)

    ### drop MONTH & YEAR columns
    #for i in xrange(0,len(input_df)):
    #    input_df[i].drop(['YEAR','MONTH'],axis=1,inplace=True)
    # Process the losses file
    #Separate out the aggregated values for Company wide (CW), zones (ZN), and special states
    #California --> total is 96; drop 05,55,75
    #Texas --> total is 94; drop 43,53
    #New York --> toal is 97; drop 32, 52
    # first separate out the aggregated values for Company wide (CW) and zones (ZN)
    print len(input_df)
    loss_df = input_df[0][~input_df[0].STATE.isin(['CW','ZN'])].copy()
    cif_df = input_df[1][~input_df[1].STATE.isin(['CW','ZN'])].copy()
    pif_df = input_df[2][~input_df[2].STATE.isin(['CW','ZN'])].copy()

    ## drop TX: 43,53; CA: 05,55,75; NY: 32,52
    substate_codes_to_drop = ['43','53','05','55','75','32','52']
    cif_df = cif_df[~cif_df.STATE.isin(substate_codes_to_drop)].copy()
    loss_df = loss_df[~loss_df.STATE.isin(substate_codes_to_drop)].copy()
    pif_df = pif_df[~pif_df.STATE.isin(substate_codes_to_drop)].copy()
    print len(cif_df),len(loss_df),len(pif_df)
    print "loss: ", loss_df.columns
    print "cif: ", cif_df.columns
    print "pif: ", pif_df.columns

    #keep only the TOTAL VOLUNTARY AUTO POLICIES
    volloss= loss_df[loss_df.LINE=='TOTVOL'].copy()
    volloss.drop(['ZONE','LINE'],inplace=True,axis=1)
    volcif= cif_df[cif_df.LINE=='TOTVOL'].copy()
    volcif.drop(['ZONE','LINE'],inplace=True,axis=1)

   #replace state codes with abbreviations/names
    volloss.replace(to_replace={'STATE':state_name_dictionary},inplace=True)
    volcif.replace(to_replace={'STATE':state_name_dictionary},inplace=True)

    save_raw = False
    if save_raw == True :
        volloss.to_csv('totalvol_loss_raw.csv',index=False)
        volcif.to_csv('totalvol_cif_raw.csv',index=False)

    # drop the ALL coverages and counts
    volloss = volloss[volloss.COVERAGE != 'ALL'].copy()
    volcif.drop(['ALL'],axis=1,inplace=True)

    # FIX up the cif file: A) copy BIPD into BI and PD B) rename columns to match volloss C) unpivot
    volcif['PD']= volcif['BIPD']
    # rename some columns to be consistent with volloss
    volcif.rename(columns={'BIPD':'BI','COV_U':'UBI','COV_W':'WBI'},inplace=True)
    # unpivot volcif data
    up_volcif = pd.melt(volcif,id_vars=['STATE','date'])
    up_volcif.rename(columns={'value':'CIF','variable':'COVERAGE'},inplace=True)
    up_volcif.head()

    #reorder both to make merging more sensible
    up_volcif.sort(['STATE','COVERAGE','date'],inplace=True)
    volloss.sort(['STATE','COVERAGE','date'],inplace=True)

    # merge the data -- inner join
    merged_df = pd.merge(volloss,up_volcif,on=['STATE','date','COVERAGE'],how='inner')
    # change this to how='outer' if you want to include cases where coverage is reported but losses are not
    # change this to how='left' if you want to include cases where losses are reported but coverage is not.
    #



    # "Correct" for cases where certain coverages are not offered
    # Logic is to zero out the values if PIP or MPC is not available in that state
    merged_df = zero_missing_coverage(merged_df, 'MPC',pip_state_list)
    merged_df = zero_missing_coverage(merged_df,'PIP',mpc_state_list)

    #rename date as year and columns to rename as used in the CENT interface.

    col_to_rename ={'REPORTED_CNT':'Reported Count','PAID_CNT':'Paid Count','PENDING_CNT':'Pending Count',
                    'PD_AMT':'Indemnity', 'date':'YEAR', 'SUIT_CNT': 'Suit Count', 'OIE_CNT':'OIE Count'}
    #remove columns not used in the analysis and rename the others
    # identify columns to remove from the analysis
    #cols_to_drop =  ['CWP','OIE_CNT','SUIT_CNT','ALAE','YEAR','MONTH']
    #merged_df.drop(cols_to_drop,axis=1, inplace=True)
    merged_df.rename(columns=col_to_rename,inplace=True)
    #Populate with Derived/Calculated Fields:
    """Injury = BI+UBI+WBI
    PIP/MPC = PIP+MPC
    Property = PD+COMP+COLL
    Severity = Indemnity (PD_AMT) / PAID_CNT
    Incurred Pure Premium = (Paid Count + Change (Pending Count))/ (mean CIF_rolling12) * Severity
    """
    #define the coverage_segments
    coverage_segments = ['Injury','Property','PIP/MPC']

    injury_df = return_summed_coverages(merged_df,['BI','UBI','WBI'],'Injury')
    property_df = return_summed_coverages(merged_df,['PD','COLL','COMP'],'Property')
    pipmpc_df = return_summed_coverages(merged_df,['PIP','MPC'],'PIP/MPC')
    master_df = pd.concat([merged_df,injury_df,property_df,pipmpc_df])
    # calculate Severity (as indemnity divided by paid count and replace infinities with zeros.
    master_df['Severity']= master_df['Indemnity']/master_df['Paid Count']
    master_df.replace([np.inf, -np.inf], 0.0,inplace=True)
    master_df['Severity'].fillna(0.0,inplace=True)
    # Calculate the Incurred Pure Premium
    aug_master_df = calc_pure_premium(master_df,12)
    aug_master_df['Incurred Pure Prem'].fillna(0.0,inplace=True)

    #clean up column headers and orders to match previous dataset format
    original_df_column_order = list(aug_master_df.columns)
    # I want to put 'STATE','COVERAGE','YEAR' first and leave the rest as they are.
    modified_column_order = []
    modified_column_order.append(original_df_column_order[original_df_column_order.index('STATE')])
    modified_column_order.append(original_df_column_order[original_df_column_order.index('COVERAGE')])
    modified_column_order.append(original_df_column_order[original_df_column_order.index('YEAR')])
    # now get the rest
    modified_column_order += list(set(original_df_column_order) - set(modified_column_order))

    master_df = aug_master_df[modified_column_order].copy()

    # sort by state/coverage/year and reindex from 0 to N
    #sort this by state/coverage/year
    master_df.sort(['STATE','COVERAGE','YEAR'],inplace=True)
    master_df.index=xrange(0,len(master_df))

    ### Save the file
    save_derived = True
    if save_derived:
        master_df.to_csv(out_file_name,index=False)


if __name__ == '__main__':
    main()
