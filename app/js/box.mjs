import 'dotenv/config'
import BoxSDK from 'box-node-sdk'
import assert from 'assert';

class Box {
    constructor() {
        this.clientID = process.env.BOX_CLIENT_ID
        this.clientSecret = process.env.BOX_CLIENT_SECRET
        assert(clientID !== undefined, "Client ID is equal to undefined, meaning that there's something wrong with how the environmental variables are working.")
        assert(clientSecret !== undefined, "Client Secret is equal to undefined, meaning that there's something wrong with how the environmental variables are working.")

        this.sdk = new BoxSDK({
            clientID: clientID,
            clientSecret: clientSecret
        })

    }
    authorize() {
        this.authorizeURL = sdk.getAuthorizeURL({
            response_type: 'code'
        })
        console.log(this.authorizeURL)
        return this.authorizeURL
    }
    async requestAccessToken() {

        const url = "https://api.box.com/oauth2/token"
        const body = {
            clientID: this.clientID,
            clientSecret: this.clientSecret,
            code: 
        }
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)

        }
        const request = await fetch(url, options)

        return response
    }
}

async function run() {

    console.log(authorizeURL)
}
run()

