#
# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

"""
A K-means clustering program using MLlib.

This example requires NumPy (http://www.numpy.org/).
"""
from __future__ import print_function

import sys

import numpy as np
from math import sqrt
from operator import add
from pyspark import SparkContext, SparkConf
from pyspark.mllib.clustering import KMeans

import csv
import nltk
import string
import pandas as pd
import re
import os
import codecs
from sklearn import feature_extraction
from collections import Counter
import pickle
from bs4 import BeautifulSoup
from sklearn import metrics
import time
import datetime
    

#from sklearn.cluster import KMeans
from sklearn.cluster import SpectralClustering
import random
import matplotlib.pyplot as plt
from sklearn.ensemble import RandomForestClassifier

from scipy.spatial import distance
from sklearn.metrics.pairwise import cosine_similarity
def new_euclidean_distances(X, Y=None, Y_norm_squared=None, squared=False):
    return cosine_similarity(X,Y)
from sklearn import cluster
from sklearn.metrics import confusion_matrix, accuracy_score
from sklearn.ensemble import RandomForestClassifier

from sklearn import cluster
from sklearn.metrics import confusion_matrix, accuracy_score

sys.path.append('/san-data/usecase/claimsgeo/gensim-0.10.3/')
import gensim
from gensim import corpora, models, similarities

import datetime
from email.utils import formatdate

#http://scikit-learn.org/stable/auto_examples/cluster/plot_dbscan.html#example-cluster-plot-dbscan-py
#print(__doc__)
from sklearn.cluster import DBSCAN
from sklearn.preprocessing import StandardScaler



def parseVector(line):
    return np.array([float(x) for x in line.split(' ')])

numberOfKMeansClusters =15
partitions = 54 #27 #27 #8*54 #216 #108 #27
def getCST_W2V_trainw2vUsingIncremetalData():
  #Updated March 23,2015
  #%pylab inline
  a=1
  print ("nw2v Analysis with T-SNE Visualization for 390 1189 "+\
    "Claims Data using w2v values obtained by training w2v model using incremetal data") 
  print  ("----------------------------------------------------")
  

  today = datetime.date.today()
  print ('Local time: ', datetime.datetime.now())
  print ("UTC time:   ", formatdate(usegmt=True))
  
  pretrainedWtoVBaseModelName = \
  "/home/facz/other/projects/Claims_ST/output/390-1189_incremental_ctext_WithFullVocab_full_DataChunk__"

  #num_features: 300, numberOfIterations: 300
  #390-1189_incremental_ctext_WithFullVocab_full_DataChunk__082_Mon_May_11_01.43.22_PM_2015_CDT.w2v_mdl
  
  #num_features: 200, numberOfIterations: 100
  #390-1189_incremental_ctext_WithFullVocab_full_DataChunk__082_Sat_May_09_02.54.24_PM_2015_CDT.w2v_mdl
  pretrainedWtoVModelName = "082_Mon_May_11_01.43.22_PM_2015_CDT.w2v_mdl"
  
  dataClusteringBaseModelName = "/home/facz/other/projects/Claims_ST/output/390-1189_DataClusteringModel_"
  ClusteringBModelName = "Tue_May_12_05_35_59_PM_2015_CDT.clust_mdl"
  
  print ("numberOfKMeansClusters:", numberOfKMeansClusters)
  print ("pretrainedWtoVBaseModelName:\n\t", pretrainedWtoVBaseModelName)
  print ("pretrainedWtoVModelName:\n\t", pretrainedWtoVModelName)
  print 
  print ("dataClusteringBaseModelName:\n\t", dataClusteringBaseModelName)
  print ("ClusteringBModelName:\n\t", ClusteringBModelName)
  
  
  pretrainedWtoVModel_FileName = pretrainedWtoVBaseModelName + pretrainedWtoVModelName
  incr_trained_model = gensim.models.Word2Vec.load(pretrainedWtoVModel_FileName)
  
  w2v_IT_wordLetters = incr_trained_model.index2word
  w2v_IT_wordVectors = np.array(incr_trained_model.syn0 )
  
  print ("\n------------\nPretrained WtoV Model stats:")
  print ("Data size:" , len(w2v_IT_wordLetters), "words.")
  NoOfWordVects, WordVectsLength = w2v_IT_wordVectors.shape 
  
  print ("\nW2v :\n" , \
    "words/vectors:", NoOfWordVects, \
    "\nvector length:", WordVectsLength) 
  
  crtElemIndex = len(w2v_IT_wordLetters)-1
  print ("Splitted Elem " + str (crtElemIndex) + ": '" + \
         w2v_IT_wordLetters[crtElemIndex] +\
     "' " + str(w2v_IT_wordVectors[crtElemIndex][1:5]) + " ..." )
  return w2v_IT_wordVectors

def estimateNoOfClusterUsingDBScan(DBScanEpsPoints,wordVectors):
  db = DBSCAN(eps=DBScanEpsPoints, min_samples=100).fit(wordVectors )
  core_samples_mask = np.zeros_like(db.labels_, dtype=bool)
  core_samples_mask[db.core_sample_indices_] = True 
  labels = db.labels_
  n_clusters_ = len(set(labels)) - (1 if -1 in labels else 0)
  print('Estimated number of clusters: %d' % n_clusters_)
  return n_clusters_

if __name__ == "__main__":
#     if len(sys.argv) != 3:
#         print("Usage: kmeans <file> <k>", file=sys.stderr)
#         exit(-1)

#     sc = SparkContext(appName="KMeans")
#     Unlike in Spark standalone and Mesos mode, in which the master's address is specified
#     in the "master"" parameter, in YARN mode the ResourceManager's address is picked up from
#     the Hadoop configuration. Thus, the master parameter is simply "yarn-client" or "yarn-cluster".
    conf = SparkConf().setAppName("KMeans").setMaster("yarn-client")
    sc = SparkContext(conf=conf)
    
    k = numberOfKMeansClusters
    
    w2v_IT_wordVectors = getCST_W2V_trainw2vUsingIncremetalData()
#     w2v_IT_wordVectors = StandardScaler().fit_transform(w2v_IT_wordVectors) 
    
#     NoOfDBScanEpsPoints = 100 
#     DBScanEpsPoints = (1000/float(NoOfDBScanEpsPoints))*(np.arange(1,NoOfDBScanEpsPoints)).astype(float)
    NoOfDBScanEpsPoints = 20 
    DBScanEpsPoints = np.exp((np.arange(1,NoOfDBScanEpsPoints)).astype(float))
    
    #DBScanClusterNumbers = sc.parallelize(DBScanEpsPoints, partitions).map(estimateNoOfClusterUsingDBScan)
    DBScanClusterNumbers = sc.parallelize(DBScanEpsPoints, partitions).map(\
         lambda m: estimateNoOfClusterUsingDBScan(m,w2v_IT_wordVectors)) 
    
    DBScanClusterNumbers.cache()
    print ("DBScanClusterNumbers.count() " + str(DBScanClusterNumbers.count()))
    
    print("\n------------\nSaving the cluster:")
    aa= DBScanClusterNumbers.collect()
    print 
    clusteringModel_FileName = ("/home/facz/other/projects/Claims_ST/output/collectedDBScanClusterNumbers"+\
       datetime.datetime.now().strftime("%I-%M%p_on_%B_%d_%Y") + ".clust_mdl.pkl")
    pickle.dump( aa, open( \
       (clusteringModel_FileName), "wb" ) )
    print ("collectedDBScanClusterNumbers save to: " + clusteringModel_FileName)

    sc.stop()
