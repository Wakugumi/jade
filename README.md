# Project Jade
Final assessment on course Computer Vision MATH6168016. Basically its an web-based real-time classifier for garbage types, using our trained MobileNet model distilled from a pretrianed ResNet50.

# Acknowledgement
Thanks to [Yang and Thung](https://github.com/garythung/trashnet) for this amazing dataset and their work as the baseline motivation of this repo.

And to credit for this work and paper (soon):
- Ananda Risyad | App Developer
- [Lawrance Cancerlon](https://github.com/Lawrance-Cancerlon) | ML Engineering and Data Curator
- [Yonathan Henry C.](https://github.com/henrychristianto) | Model Evaluator, Writer, Editor
- [Bryan Wu](https://github.com/BryanWu1020) | Writer, Editor
- Ruby Belinda G. | Editor

# [Experiment Docs](./docs/experiment.md)
Read more at [docs](./docs/experiment.md)

# Classifier Model
We continue the work of the original author of the dataset, [Yang and Thung](https://github.com/garythung/trashnet).
They wrote a paper on classifying trash for recyclability status ([Their paper](https://cs229.stanford.edu/proj2016/report/ThungYang-ClassificationOfTrashForRecyclabilityStatus-report.pdf)) which they've collected their data themselves.

With Torch, We trained a MobileNet model with knowledge distillation from a trained ResNet50 in objective to increase predictive performance and better generalization. The Python Notebook for the modeling can be found here too.

# Web App
We port the model's weight params and by using ONNX runtime allow us to port this into JavaScript.
The app is the user interface of the model usage. User can start the web and by utilizing device's camera, they can get real-time inferencing from the model.

To run the app, go to the `app/` dir and run this commands:
```
npm install
npm run build
npm run dev
```
## Prerequisite:
- NodeJS v24.x

# Hardware Benchmark

To Be Benchmark soon
