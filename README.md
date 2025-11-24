# Project Jade
Project Jade is my assessment on course Computer Vision. Basically its an web-based real-time classifier for garbage types.
I haven't think of a good name and decide to align with my other personal project naming convention.

# Classifier Model
We continue the work of the original author of the dataset, [Yang and Thung](https://github.com/garythung/trashnet).
They wrote a paper on classifying trash for recyclability status ([Their paper](https://cs229.stanford.edu/proj2016/report/ThungYang-ClassificationOfTrashForRecyclabilityStatus-report.pdf)) which they've collected their data themselves.

With Torch, We trained a MobileNet model with knowledge distillation from a trained ResNet50 in objective to increase predictive performance and better generalization. The Python Notebook for the modeling can be found here too.

# Web App
We port the model's weight params and by using ONNX runtime allow us to port this into JavaScript.
The app is the user interface of the model usage. User can start the web and by utilizing device's camera, they can get real-time inferencing from the model.
``

# Hardware Benchmark

To Be Benchmark soon
