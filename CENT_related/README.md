Author list
* Jason Sanchez (m9tn)
* AJ Rader (kesj)
* Ryan Herr (ms2h)

## Issue tracker
https://sfgitlab.opr.test.statefarm.org/M9TN/claims-early-notification-tool/issues?scope=all&sort=newest&state=opened

# Claims Early Notification System
## Main files
pull_data_CENT.py: Pulls data from database and transforms it into
the base_data_CENT.csv file.
* WARNING: currently this file is merely a placeholder. 
    A sample datafile can be obtained here: 
    \\Opr.statefarm.org\dfs\CORP\00\PUBLIC\STRATEGIC RESOURCES\SHARED\Jason's Files\Claims Early Notification Tool

Old approach (serially on edge node):
model_CENT.py: Operates on the base csv file and generates two JSON
files. The overview file is used to color the map. The details file is 
used to generate the state charts.

Current approach: parallel_process.py: operates on the base csv file and generates 4 JSON
files. Two each for monthly (MLY) and rolling 12 (R12). The overview files are used to color
the USA map and generate the overview table. The details files are used to generate the
charts for each state.

web_app: Folder
* data: Folder that will contain detail.json and overview.json files after parallel_process.py is run
* static: Folder
 * fonts: Folder that contains font information
 * All other files should be described by Sam Crank
* templates: Folder that contains index.html template (the main page)
* flask_app_CENT.py: Launches web app. python <.../>flask_app_CENT.py runs the file


## Supplemental files
README.md: This file. Should provide enough details so a new user could
clone the project and understand how to deploy it.

.gitignore: Defines files not to commit to the repo.

mltimeseries.py: A package made to convert a time series data set to a
dataset useful for regression-based machine learning.


## How to run the project
To pull updated data, run the pull_data_CENT.py file. In Windows, open 
the command prompt in the same folder as the pull_data_CENT.py file and
type: python pull_data_CENT.py. Enter your workstation username and 
password when prompted. In the future we hope this file connects to PCADSS and pulls the
required data, munges it as needed, and outputs it as a csv file named
base_data_CENT.csv to the same directory. 

Next, run the parallel_process.py  file. This file takes the base_data_CENT.csv
file and creates a custom machine learning model for each time series. 
All the predictions are saved to json files in the web_app/data 
directory. A sample commandline usage is:

python parallel_process.py base_data_CENT.csv -u claiment -l local_file_path -o outname -i local_input_path


Navigate to the web_app directory and run the flask_app_CENT.py file to
launch the web app. Go to http://localhost:7001/CENT/v0.1/#/overview. to
view the model locally. If on a server, replace localhost with the 
hostname of the server (e.g. http://nc74sas1:7000/CENT/v0.1/#/overview)