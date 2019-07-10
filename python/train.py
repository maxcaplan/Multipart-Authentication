import tensorflow as tf
import os
import time
import sys
import json
import matplotlib.pyplot as plt

lines = sys.stdin.readline()
data = json.loads(lines)


##################
#Image Processing#
##################


train_dir = str(data['trainingDir'])
validation_dir = str(data["validationDir"])

# print('Total training images: ' + str(len(os.listdir(train_dir))))
# print('Total validation images: ' + str(len(os.listdir(validation_dir))))

image_size = 160
batch_size = 5

# Rescale all images by 1./255 and apply image augmentation
train_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
    rescale=1./255)

validation_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
    rescale=1./255)

train_generator = train_datagen.flow_from_directory(
    train_dir,
    target_size=(image_size, image_size),
    batch_size=batch_size,
    class_mode='binary')

validation_generator = validation_datagen.flow_from_directory(
    validation_dir,
    target_size=(image_size, image_size),
    batch_size=batch_size,
    class_mode='binary')


##################
# Model Building #
##################


# check if input model exists
if data['model'] is None:
    # create new model
    IMG_SHAPE = (image_size, image_size, 3)

    # Create the base model from the pre-trained model MobileNet V2
    base_model = tf.keras.applications.MobileNetV2(input_shape=IMG_SHAPE,
                                                   include_top=False,
                                                   weights='imagenet')

    # freeze base model
    base_model.trainable = False

    # new model built from base model
    model = tf.keras.Sequential([
        base_model,
        tf.keras.layers.GlobalAveragePooling2D(),
        tf.keras.layers.Dense(1, activation='sigmoid')
    ])

    model.compile(optimizer=tf.keras.optimizers.RMSprop(lr=0.0001),
                  loss='binary_crossentropy',
                  metrics=['accuracy'])

else:
    # load input model
    model = tf.keras.models.load_model(str(data['model']))


############
# Training #
############


# Start with training the model with the base model frozen
if data["epochs"] is None:
    epochs = 10
else:
    epochs = int(data["epochs"])

steps_per_epoch = train_generator.n
validation_steps = validation_generator.n

history = model.fit_generator(train_generator,
                              steps_per_epoch=steps_per_epoch,
                              epochs=epochs,
                              workers=4,
                              validation_data=validation_generator,
                              validation_steps=validation_steps)


# Tune the model by training with base model unfrozen
base_model.trainable = True

# Fine tune from this layer onwards
fine_tune_at = 100

# Freeze all the layers before the `fine_tune_at` layer
for layer in base_model.layers[:fine_tune_at]:
    layer.trainable = False

model.compile(loss='binary_crossentropy',
              optimizer=tf.keras.optimizers.RMSprop(lr=2e-5),
              metrics=['accuracy'])

tuneHistory = model.fit_generator(train_generator,
                                  steps_per_epoch=steps_per_epoch,
                                  epochs=epochs,
                                  workers=4,
                                  validation_data=validation_generator,
                                  validation_steps=validation_steps)
# save the model to the appropiate directory
if data['model'] is None:
    date = time.time()
    print("saving new model to: ../models/" +
          str(data['name']) + "/" + str(date) + '.h5')
    os.makedirs("./models/" + str(data['name']) + "/")
    model.save('./models/' + str(data['name']) + "/" + str(date) + '.h5')
else:
    model.save(data['model'])


############
# Plotting #
############


if data['plot']:
    acc = history.history['acc']
    val_acc = history.history['val_acc']

    loss = history.history['loss']
    val_loss = history.history['val_loss']

    plt.figure(figsize=(8, 8))
    plt.subplot(2, 1, 1)
    plt.plot(acc, label='Training Accuracy')
    plt.plot(val_acc, label='Validation Accuracy')
    plt.legend(loc='lower right')
    plt.ylabel('Accuracy')
    plt.ylim([min(plt.ylim()), 1])
    plt.title('Training and Validation Accuracy')

    plt.subplot(2, 1, 2)
    plt.plot(loss, label='Training Loss')
    plt.plot(val_loss, label='Validation Loss')
    plt.legend(loc='upper right')
    plt.ylabel('Cross Entropy')
    plt.ylim([0, max(plt.ylim())])
    plt.title('Training and Validation Loss')
    plt.show()

print("done")
