# Multi-part Authentication

An experiment with multi-part authentication using machine learning 

---

#### Table of Contents:
+ [Prerequisites](#prerequisites)
+ [Installation and Setup](#installation)
+ [Usage](#usage)
+ [Contributing](#contributing)
+ [License](#license)

---

<a name="prerequisites"></a>
## Prerequisites 

To run this project your server machine needs to have the following installed:
+ [Python 3](https://www.python.org/)
+ [pip3](https://pypi.org/)
+ [Node](https://nodejs.org/en/)

follow the installation instructions specific to your OS

<a name="installation"></a>
## Installation and Setup

1. **Use the Node package manager [npm](https://www.npmjs.com) to install all of the projects Node dependencies.**

```bash
npm install
```

2. **Use the Python 3 package manager [pip](https://pypi.org/project/pip/) to install all of the projects Python dependencies**

```bash
pip3 install -r requirements.txt
```

If you are running *Ubuntu* run the following command to make sure Tkinter is properly installed:

```bash
sudo apt-get install python3-tk
```

<br/>

2. **Generate your vapid keys:**
```bash
./node_modules/.bin/web-push generate-vapid-keys
```
The output should look similar to the following:
```bash
=======================================

Public Key:
<Your Key Here>

Private Key:
<Your Key Here>

=======================================
```

Copy these keys into their respective variables in the `.env_example` file.

<br/>

3. **Connect to your MongoDB Cluster**

This project uses MongoDB as the database for storing user profile information. You will need to setup your own cluster with [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

<br/>

Once you've created a cluster, navigate to the connect dialog and select *Connect Your Application* You should be given a url that looks like the following:
```node
'mongodb+srv://<Your User>:<password>@<Your Cluster>.mongodb.net/test?retryWrites=true&w=majority'
```
copy this url with the correct user password replacing ```<password>``` into the ```DB_URL``` variable in `.env_example`

<br/>

4. **Finalize the `.env_example` File**

Remove `_example` from the `.env_example` file name and your `.env` will be finalized

<a name="usage"></a>
## Usage
Start the node server:
```bash
npm run serve
```

Alternatively, run the server in development mode:
```bash
npm run dev
```

---

You can change the default port (8080) the server runs on in ``package.json``:

```JSON 
"config": {
    "port": "<Your Port Here>"
}
```

---

To delete a user from the server type:
```bash
delUser
```
In your terminal while the server is running. The appropriate prompts will follow

<a name="contributing"></a>
## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

<a name="license"></a>
## License
[MIT](https://choosealicense.com/licenses/mit/)
