#!/usr/bin/env python


import sys
from sklearn.ensemble import RandomForestClassifier
import numpy as np
import pickle as pickle
import base64


#initialize some values
train_data=[] #an np.array to hold the randomForest input
ntrees = 10 #the number of trees in the forest

def CreateForest(trainingData):
    #n_estimators = trees in forest
    #everything else is default for now, but for more info see http://scikit-learn.org/dev/modules/generated/sklearn.ensemble.RandomForestClassifier.html
    Forest = RandomForestClassifier(n_estimators = 10)
    #First input is numpy array of independent variables  Second Argument is the dependant variable
    Forest = Forest.fit(train_data[0::,1::],train_data[0::,0])
    pickledForest = base64.b64encode(pickle.dumps(Forest))
    #emit pickledForest
    print(pickledForest)

def FeatureManipulation(trainingData):
    #python randomForests cast the numpy array to floats
    #unlike R.  So, this converts female to 1 and male to 2
    #so that everything floats.
    trainingData[trainingData[0::,2] == "female",2] = "1"
    trainingData[trainingData[0::,2] == "male",2] = "2"
    return trainingData

#main loop here.  For each line, split the key, value.  Each reducer
#should only handle one key space.
#this builds that single keyspace to a numpy array, that will be fit to a forest
for line in sys.stdin:
    line=line.strip()
    key,value = line.split(':')
    values=value.split(',')
    train_data.append(values)
#cast the list to a np.array
train_data = np.array(train_data)
#clean up the gender features
train_data = FeatureManipulation(train_data)
#make the forest
CreateForest(train_data)






