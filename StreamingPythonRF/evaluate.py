#!/usr/bin/env python


import sys
from sklearn.ensemble import RandomForestClassifier
import numpy as np
import pickle as pickle
import base64
import csv

def CreateTestDataArray():
    #open the test train_data set
    csv_test_object = csv.reader(open('./test_clean.csv', 'rb')) 
    header = csv_test_object.next()
    #put the file object rows into a list.   Then convert that list to a numpy array
    #the array will be [rowsxcolumns] big
    test_data=[]
    for row in csv_test_object:
        test_data.append(row)
    test_data = np.array(test_data)
    
    #clean up the test data features here.   
    
    #find empty pclass and make them 3 (median)
    test_data[test_data[0::,0] == "",0] = "3"
    #gender  1 = female 2=male  (female is first, very pc of me)  default to female
    #future improvement would be check if the survived.  if so, 75% they are female....
    test_data[test_data[0::,1] == "",1] = "1"
    test_data[test_data[0::,1] == "female",1] = "1"
    test_data[test_data[0::,1] == "male",1] = "2"
    #find empty ages and fill them with the median age "28"
    test_data[test_data[0::,2] == "",2] = "28"
    #number of kids/spouses.   Set to 0 (median) if empty
    test_data[test_data[0::,3] == "",3] = "0"
    #number of parch, median 0
    test_data[test_data[0::,4] == "",4] = "0"
    #fare
    #median is 14.4
    #future improvement, this could be estimated based on passenger class
    test_data[test_data[0::,5] == "",5] = "14.4"
    #convert everything to floats
    test_data[0::,0::].astype(np.float)
    #Victory!  return the cleaned numpy array!  
    return test_data

def unpickleForests():
    forests=[]
    forestFile = open("pickledForests",'r')
    for line in forestFile:
        line = line.strip()
        forests.append(pickle.loads(base64.b64decode(line)))
        return forests
    forestFile.close()
    
def evaluateTest(forests, test_data):
    len_of_testdata = len(test_data)
    number_of_forests=len(forests)
    output=[]
    output=np.zeros(len_of_testdata)
    
    #this part predicts the test data for each forest and then adds the predictions
    for forest in forests:
        pred=forest.predict(test_data)
        #cast the predicted values to ints
        pred=pred.astype(np.int)
        #sum all the predicted values
        output=map(sum,zip(pred,output))
    
    #average the results essentially....
    #div by number of forests...  < .5 is 0 > .5 is 1
    output=np.array(output)  
    output = output/number_of_forests
    #round to the nearest integer
    np.rint(output)
    
    #convert back to list and print it
    output.tolist()
    outputFile = open('predict', 'wb')
    for predict in output:
        predict=predict.astype(str)
        outputFile.write(predict +  "\n")
        #print (predict,"0")
    


 
 ### MAIN ###
 
#open the serialized forests, unpickle them back to rf objects, and return them in a list    
forests=unpickleForests()
#open and clean test data
test_data=CreateTestDataArray()

evaluateTest(forests,test_data)

