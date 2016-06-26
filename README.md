#Intel Edison Virtual Reality

This project was developed as part of the Hartford Hackster.io June 25th, 2016 Hackathon. Intel and Seeed provided Intel Edison and Grove Starter kits to all participants. This project demonstrates the use of the Edison as a sensor gateway, connecting to AWS IOT service for use by a client utilizing Google Cardboard VR glasses.

The Edison takes sensor readings which are then published to a topic bound to AWS IOT. This service in turn takes all sensor readings received and, through the rule engine, publishes them onto a queue (SQS). For the web app, the ThreeJS library provides the graphics and stereoscopic view needed for the Cardboard glasses. The client is using the AWS SDK for JavaScript in the Browser to poll the queue to get sensor readings, which are used to affect how fast the "strobe" is spinning in the scene. You can view the client in a web browser on your phone, placed inside the Cardboard.

This project was an excercise to learn more about ThreeJS, Virtual Reality, and how the real, physical world can be used as inputs to a constructed, virtual world.
