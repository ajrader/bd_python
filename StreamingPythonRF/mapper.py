#!/usr/bin/env python

import sys
#number of groups of data to create
groups=3

key=1

# input comes from STDIN (standard input)
for line in sys.stdin:
    line=line.strip()
    print '%s:%s' % (key,line)
    key = key + 1
    if key == 4:
        key = 1
        

