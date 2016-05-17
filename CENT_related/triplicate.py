#!/opt/anaconda/latest/bin/python
import sys
import json

time_horizon_list = [1,6,12]
for line in sys.stdin:
    key, value = line.strip().split('\t')
    state,coverage = json.loads(key)
    for time_horizon in time_horizon_list:
        key2 = [state,coverage,time_horizon]
        line = json.dumps(key2) + '\t' + value
        print line

