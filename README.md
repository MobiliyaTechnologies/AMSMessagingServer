# Messaging Server
﻿   It will receive all the event form IOT hub/event Hub and forward it on all socket connected.

## Getting Started

   These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

* Install dependency components (like npm ).

* ARM template should add following configuration in app.settings/web.config

   * CUSTOMCONNSTR_ConnectionString (It is an azure IOT hub connection string )
   
   * CUSTOMCONNSTR_ConsumerGroup (It is an azure IOT hub consumer group )
   
   * CUSTOMCONNSTR_EventHubConnectionString (It is an azure Event Hub connection string)
   
   * CUSTOMCONNSTR_EventHubPath (It is an azure Event Hub name)
   
   
.

### Running Locally	
	
   * Open code in microsoft visual studio and rebuild it.
   
   * Host it on IIS.

## Deployment

 * Follow the ARMTemplate guidelines to deploy this project on Azure.
 
