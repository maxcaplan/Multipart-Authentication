import os

from recognize_voice import recognize_voice
from functionality import relative_path


def remove_voice():
    # prompt user to provide a name which they would care to remove
    name = input("Which voice would you like to remove from the database: ")

    # initialize variables containing the path to specified files
    voice_dir = relative_path('./data/database/' + name)
    gmm_dir = relative_path('./models/gmm/' + name + ".gmm")

    # check that files exist for the specified name
    if os.path.exists(voice_dir):
        num_wavFiles = len(os.listdir(voice_dir))
        print("Directory for %s containing %d .wav files was found in the database" % (name, num_wavFiles))
    else:
        print("No existing audio files (.wav) for %s were found in the database" % name)
    if os.path.exists(gmm_dir):
        print("Gaussian Mixture Model (.gmm) file for %s was found" % name)
    else:
        print("No existing Gaussian Mixture Model (.gmm) file for %s was found " % name)

    # verify that the user attempting to delete the voice should be granted access to do so
    access = False
    print("Please verify that you are the user you are attempting to remove")
    identify = recognize_voice()
    # if the user identified by recognize voice matches the name they are deleting grant access
    # give Will Macdonald administrative access
    if (name == "Will Macdonald" or name == "Unknown") and identify != "Will Macdonald":
        print("[ACCESS DENIED] You do not have access to delete the specified name")
        return
    elif identify == name or identify == "Will Macdonald":
        access = True
    elif not access:
        print("[ACCESS DENIED] Invalid user, access to delete specified voice not granted")
        return
    else:
        print("Encountered an error please run 'remove_voice.py' again")
        return

    # verify that user would like to proceed with the deletion of this user
    while True:
        if os.path.exists(voice_dir) or os.path.exists(gmm_dir):
            verify = input("Would you like to proceed with the deletion of these files? (y/n): ")
            if verify is 'y':
                if os.path.exists(voice_dir):
                    wav_files = os.listdir(voice_dir)
                    for i in range(len(wav_files)):
                        file_dir = relative_path(voice_dir + "/" + wav_files[i])
                        try:
                            os.remove(file_dir)
                        except FileNotFoundError:
                            print("%s was not deleted" % wav_files[i])
                            pass
                    os.removedirs(voice_dir)
                    print("Audio files (.wav) for %s have been successfully deleted" % name)
                if os.path.exists(gmm_dir):
                    os.remove(gmm_dir)
                    print("Gaussian Mixture Model (.gmm) file for %s has been successfully deleted" % name)
                return
            elif verify is 'n':
                print("Files pertaining to %s are not being deleted" % name)
                return
            else:
                print("Please enter a valid response (enter 'y' for yes or 'n' for no)")


if __name__ == '__main__':
    remove_voice()
