# program to pass python code to hadoop streaming

import subprocess

def create_hdfs_directory(usecase):
    """
    Function to check on the existence of the related hdfs namespace for this project
    :rtype : string
    """
    from uuid import uuid4
    import os
    import subprocess

    # check if the usecase directory exists
    hdfs_prepend = '/data/discovery/'
    hdfs_path = hdfs_prepend+usecase

    if subprocess.call(['hdfs','dfs','-ls',hdfs_path]): # directory doesn't exist.
        # place in the users directory space
        uname = os.getenv('USER', '')
        random_folder = str(uuid4())
        # build it in the users space
        hdfs_path = '/user/' + uname + '/' + random_folder
        if subprocess.call(['hdfs','dfs','-ls','/user/'+uname]): # if directory doesn't exist.
            hdfs_path = '/tmp/' + uname + '/' + random_folder # assign to the tmpdirectory

    print usecase,hdfs_path
    return hdfs_path

def hadoop_streamer(mapper, reducer, input_file, outpath, files=None, options=''):
    """
    :param mapper: the name of the python file to use as a mapper
    :param reducer: the name of the python file to use as a reducer
    :param input_file: the name of the input data file (directory?)
    :param outpath: HDFS location where data is to be stored.
    :param files: additional files to add to the hadoop cmd line call for python streaming
    :param options: additional java options to pass to the mapreduce job
    :return: the result of concatenating the files produced by the hadoop streaming job
    """
    #
    # TODO: define jar as a variable
    jar = '/opt/cloudera/parcels/CDH/lib/hadoop-mapreduce/hadoop-streaming.jar'
    # attach necessary mapper & reducer files (python) to the streaming file path.
    files.append(mapper)
    files.append(reducer)
    files = ','.join(files)

    # create a tmp directory in HDFS to store results
    tcmd = ['hdfs', 'dfs', '-mkdir']
    tcmd.append(outpath+'/tmp')
    #to do check if it exists
    subprocess.call(tcmd)

    """# check if input file is in hdfs already
    file_not_in_hdfs = subprocess.call(['hadoop', 'fs', '-ls', bdir + input_file])
    #print "check if the file {0} is in hdfs {1}:".format(input_file,file_not_in_hdfs)
    ## output of the above system call is 0 if file exists, 1 otherwise
    if file_not_in_hdfs:  #copy from input loation (local FS) if not there.
        subprocess.call(['hadoop', 'fs', '-put', 'input_file', 'base_hdfs_dir'])

    #file_not_in_hdfs = subprocess.call(['hadoop','fs','-ls',input_file])
    #print "check if the file {0} is in hdfs {1}:".format(input_file,file_not_in_hdfs)
    ## output of the above system call is 0 if file exists, 1 otherwise
    #if file_not_in_hdfs: #copy from input loation (local FS) if not there.
    #    subprocess.call(['hadoop', 'fs', '-put', 'input_file', 'baseHDFSdir'])

    # append the staging and derived directories
    list_file_path_names = ['/staging/','/derived/']

    """
    # run the streaming job

    ofile = outpath+'/tmp'+ '/output'
    print input_file, ofile
    #streaming commandline
    stcmd = ['hadoop', 'jar', jar, '-files', files, options, '-mapper', mapper,
             '-reducer', reducer, '-input', input_file,
             '-output', ofile]
    subprocess.call(stcmd)
    # To Do create location to store the output to a log?

    ocmd = ['hdfs', 'dfs', '-cat']
    ocmd.append(ofile + '/part*')
    #output = subprocess.check_output(ocmd)#['hadoop','fs'#!hadoop fs -cat /tmp/{random_folder}/output/part*
    output = subprocess.check_output(ocmd)
    return output

