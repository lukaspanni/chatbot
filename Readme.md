# Instructions

## Run with Docker

First, build the docker image:

```bash
docker build -t warbot .
``` 

Then, run the docker image:

```bash
docker run -it warbot
```

Thats it! You should be able to use the chatbot and asks questions about casualties in the war.


## Run locally

You have to have node installed locally. A Version > 17.0.0 is recommended.
First, install the dependencies:

```bash
npm install
```

Then, build chatbot:

```bash
npm run build
``` 
  
Finally, run the warbot:

```bash
npm start
```
or 
```bash
npm start -- warbot
```

To run the eliza-chatbot, run:

```bash
npm start -- eliza
```


# Quit the chatbot
In the chatbot-REPL, type `:quit`, `:exit` or `:q` to quit.


# License 
See LICENSE file.
The eliza-chatbot is adapted from https://github.com/aichaos/rivescript-js.
See the license notice in src/eliza/eliza.rive for more information.