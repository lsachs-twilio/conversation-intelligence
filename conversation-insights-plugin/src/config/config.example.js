export default config = {
    GET_RECOMMENDATIONS_URL: `http://localhost:<your-conversation-relay-port>/get-recommendations`,
    CREATE_AUDIENCE_URL: 'http://localhost:<your-conversation-relay-port>/create-audience',
    LOOKER_URL: "<your-looker-embed-url>"
}

// ^If you haven't changed any ports, the recommendations and audience URLs will just be http://localhost:3001/get-recommendations and http://localhost:3001/create-audience
// However, if you've deployed the conversation-relay node app to heroku or somewhere on the internet - the above routes would just need to be updated from localhost to that domain.
