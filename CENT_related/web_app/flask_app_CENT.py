from flask import Flask, jsonify, make_response, abort, request, render_template
import json

app = Flask(__name__)

# Global variables
app_name = "CENT"
app_version = "v0.2"
BASE_URL = "/" + app_name + "/" + app_version + "/"
METADATA = {"states": ['ALABAMA', 'ALASKA', 'ARIZONA', 'ARKANSAS', 'CALIFORNIA', 'COLORADO', 'CONNECTICUT', 'DELAWARE','DIST OF COL' 'FLORIDA', 'GEORGIA', 'HAWAII', 'IDAHO', 'ILLINOIS', 'INDIANA', 'IOWA', 'KANSAS', 'KENTUCKY', 'LOUISIANA', 'MAINE', 'MARYLAND', 'MASSACHUSETTS', 'MICHIGAN', 'MINNESOTA', 'MISSISSIPPI', 'MISSOURI', 'MONTANA', 'NEBRASKA', 'NEVADA', 'NEW HAMPSHIRE', 'NEW JERSEY', 'NEW MEXICO', 'NEW YORK', 'NORTH CAROLINA', 'NORTH DAKOTA', 'OHIO', 'OKLAHOMA', 'OREGON', 'PENNSYLVANIA', 'RHODE ISLAND', 'SOUTH CAROLINA', 'SOUTH DAKOTA', 'TENNESSEE', 'TEXAS', 'UTAH', 'VERMONT', 'VIRGINIA', 'WASHINGTON', 'WEST VIRGINIA', 'WISCONSIN', 'WYOMING'],
            "coverages": ['BI', 'Coll', 'Comp', 'Injury', 'MPC', 'PD', 'PIP', 'PIP/MPC', 'Property', 'UBI', 'WBI'],
            #"metrics": ['Overall', 'Indemnity', 'Paid Count', 'Pending Count', 'Reported Count', 'Severity']}
            "metrics":['Indemnity','Paid Count','Pending Count','Reported Count','Severity','Suit Count','ALAE','OIE Count']}

# Simple compress all json
app.config["JSONIFY_PRETTYPRINT_REGULAR"] = False
json.JSONEncoder.item_separator = ','
json.JSONEncoder.key_separator = ':'

# Load data sets
with open("data/overview_MLY.json") as data:
    overall_data = json.load(data)
with open("data/overview_R12.json") as data:
    overall_data_R12 = json.load(data)
with open("data/detail_MLY.json") as data:
    detail_data = json.load(data)
with open("data/detail_R12.json") as data:
    detail_data_R12 = json.load(data)    
    

# Clean NaNs
def remove_NaNs(d):
    """Remove all NaNs from data"""
    for key, values in d.iteritems():
        if isinstance(values, dict):
            remove_NaNs(values)
        else:
            if isinstance(values, list) and len(values) > 1 and values[0] != values[0]:
                d[key] = []
                
remove_NaNs(overall_data)
remove_NaNs(detail_data)
remove_NaNs(overall_data_R12)
remove_NaNs(detail_data_R12)

@app.errorhandler(404)
def not_found(error):
    return make_response(jsonify({'error': 'Not found'}), 404)


@app.route(BASE_URL)
def version_info():
    return render_template('index.html')


@app.route(BASE_URL + "map.svg")
def get_map_file():
    return app.send_static_file('map.svg')

@app.route(BASE_URL + "api")
def show_api():
    # Figure out how to show a file
    return "Documentation on the API"

@app.route(BASE_URL + "metadata", methods=['GET'])
def get_metadata():
    """
    Returns a page with the sorted versions of all the keys in the json files.
    Useful for looping through parameter lists efficiently and consistently.
    """
    parameters = request.args.get('args')
    if parameters:
        result = jsonify({"%s"%parameters: METADATA[parameters]})
    else:
        result = jsonify(METADATA)
    return result

@app.route(BASE_URL + "overview", methods=['GET'])
def get_overview_data():
    """
    Gets overall dataset based on time horizon.
    
    If you pass ?horizon=<1, 6, 12> parameter, returns the data 
    associated with the time. Defaults to 1 if incorrect horizon 
    provided or if not specified.
    """
    # Represent all floats as just their units digit.
    json.encoder.FLOAT_REPR = lambda o: "%.0f" % o
    # Read in time horizon. Convert to string. Default to "1"
    time_horizon = request.args.get('horizon')
    default_time_horizon = "1"
    if time_horizon and str(time_horizon) in overall_data:
        time_horizon = str(time_horizon)
    else:
        time_horizon = default_time_horizon
    
    data_view = request.args.get('period')
    default_data_view = "R12"
    if data_view is None or data_view not in ["R12", "Monthly"]:
        data_view = default_data_view
    if data_view == "Monthly":
        return jsonify(overall_data[time_horizon])
    if data_view == "R12":
        return jsonify(overall_data_R12[time_horizon])

@app.route(BASE_URL + "detail")
def get_details():
    """
    Must supply a ?state=<STATE> parameter to have the state data returned.
    
    If you pass ?horizon=<1, 6, 12> parameter, returns the data 
    associated with the time. Defaults to 1 if incorrect horizon 
    provided or if not specified.
    """
    # Round floats to the nearest whole number
    json.encoder.FLOAT_REPR = lambda o: "%.0f" % round(o,0)
    # Read in time horizon. Convert to string. Default to "1"
    time_horizon = request.args.get('horizon')
    default_time_horizon = "1"
    if time_horizon and str(time_horizon) in overall_data:
        time_horizon = str(time_horizon)
    else:
        time_horizon = default_time_horizon
        
    state_parameter = request.args.get('state')
    
    data_view = request.args.get('period')
    default_data_view = "Monthly"
    if data_view is None or data_view not in ["R12", "Monthly"]:
        data_view = default_data_view 
    # Try to find state in data. If not found, raise error.
    try:
        if data_view == "Monthly":
            results = detail_data[time_horizon][state_parameter]
        if data_view == "R12":
            results = detail_data_R12[time_horizon][state_parameter]
        return jsonify(results)
    except:
        return jsonify({"error": "State not in metadata. Valid options include: %s" % str(METADATA["states"])})


if __name__ == "__main__":
    app.run(port=7001, debug=False, host='0.0.0.0', threaded=True)
