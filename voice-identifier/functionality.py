# import the necessary packages
from os import listdir, makedirs
from os.path import isfile, isdir, join, exists, dirname


# lists all files in the specified directory that are of a specific file extension type
def file_listing(dir, extension):
    files = [join(dir, f) for f in listdir(dir) if isfile(join(dir, f))]
    return list(filter(lambda f: f.endswith('.' + extension), files))


# lists all directories that fall within a specified directory
def dir_listing(base_dir):
    return [join(base_dir, d) for d in listdir(base_dir) if isdir(join(base_dir, d))]


# check that the specified path does not yet exist; if this is the case, create this directory
def mkdir(path):
    if not exists(path):
        makedirs(path)


# fetches the last component in the given path
def last_component(path):
    return path.split('/')[-1]


# check that a specified file exists
def file_exists(path):
    return isfile(path)


# reference a specified path that is contained within within the current working directory
def relative_path(path):
    base_dir = dirname(__file__)
    return join(base_dir, path)


# returns the name of the specified file without the file extension
def get_file_name(filepath):
    return last_component(filepath).split('.')[-2]


# lists the distances of the k nearest neighbors
def k_nearest(k, distances):
    distances.sort(key=lambda dist: dist[0])
    return list(map(lambda dist: dist[1], distances[:k]))


def most_common(lst):
    if len(lst) == 0:
        return None
    return max(set(lst), key=lst.count)
