# CycleHub

CycleHub is monitor of a bike-sharing system designed to promote sustainable urban mobility, reduce traffic congestion, and provide convenient transportation options for city dwellers. Similar to Dublin Bike websites, CycleHub aims to provide a network of strategically located bike stations throughout the city where users can easily rent and return bicycles for short trips.

![Logo](https://github.com/ChristianKeogh/CycleHub/assets/148101801/7fcfc16d-947e-43ba-b9d4-f7f2bd70058a)


This website was created as a journey planner for users of Dublin Bikes. The stack used is as following:

HTML, CSS, JS, Flask, AWS, SQLalchemy, a Linear Regression predictive model, OpenWeather API, and Google Maps API.

The integration of Google Maps and OpenWeather allowed the website to create a joruney layout that brings the user to the closest station, on a cycle path through Dublin, to the station that is closest to their destination, and finally to their final destination via a walking route.

![2](https://github.com/ChristianKeogh/CycleHub/assets/148101801/5290342f-7632-4aee-b6e7-cbb5e9406444)

The journey planner takes an input of day and time and gives a prediction based on future weather how busy different stations will be.

![1](https://github.com/ChristianKeogh/CycleHub/assets/148101801/6459aae5-2613-46d5-b932-b854c0732d64)

Below is some of the output of the data modelling we leveraged.

![average_demand_bikes](https://github.com/ChristianKeogh/CycleHub/assets/148101801/0a50ea77-9a03-4aaf-832a-fc63f883df84)

![cv_fold1](https://github.com/ChristianKeogh/CycleHub/assets/148101801/dadf504c-137a-492f-8934-a0f8f127a550)

![example_plot](https://github.com/ChristianKeogh/CycleHub/assets/148101801/0424c10c-db5f-4ee4-b42b-36d956c30a0c)
