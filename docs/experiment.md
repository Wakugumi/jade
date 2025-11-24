# Objective
Objective: Create a realtime inference model to classify garbage based on its type.

Milestones:
- [x] Model a high performing heavy neural network classifier and save its parameters (Model A: ResNet50)
- [x] Model an lightweight mobile-based model for realtime inferencing (Model B: MobileNet)
- [x] Experiment and evaluate the lightweight model in realtime inferencing
- [x] Start new model based on the same architecture (Model C) with having Model A's weight as knowledge distillation to Model C
- [ ] Comparative Analysis between Model B and Model C with:
  - [x] Model Performance
  - [ ] Benchmarking (e.g. latency, memory footprint)

# Tools and Libs
All modeling is done with Torch library. To rebuiild the model, refer to the imported notebook and load the state in [this dir](../model/weights/).

# Data Preprocess
In order to reduce overhead performance of realtime inferecing, we need to minimize data transformation as little as possible. So we start by using the most basic preprocessing:

```python

preprocess = T.Compose([
  T.Resize((224, 224)),
  T.ToTensor(),
  T.Normalize(                   
    mean=[0.485, 0.456, 0.406],
    std=[0.229, 0.224, 0.225]
  )
])
```

The Normalize constants are derived from the standard preprocessing of pretrained ResNet50 in the ImageNet dataset. Complying with their means and std should be sufficient to generalize well with our own data. 

This proprocessing are applied the same across our milestones.

# Model A (ResNet50)

Data were split into: 80% training, 10% validation and 10% test.

The architecture is straightforward, with ResNet50 and a fully connected layer of 6 outputs (number of classes). The training done with a class weight computed from the number of each class to balance the distribution.

## Training Log
Training log can be found [here](./log.md).



# Model B (MobileNet)
In order to evaluate the effectiveness of ResNet50 as the teacher in this knowledge distillation, we model the same task with MobileNet.

The modeling [log](./log.md)


# Model C (MobileNet)
This model is the final product that will be used for real-time classifier. In theory, this model should have at least slight improvement in predictive strength and better generalization.

The performance log can be [seen here](./log.md).

Hence the result of this model and its parameters is exported in [ONNX file](../model) for deployment.
