# NFT token listing dfinity service

CRUD operations on listing NFT tokens

## Setup Locally 

### First setup
```text
Clone the project
1. git clone git-repo-url
2. Install modules from package json
    npm install
3. Install node version manager
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
4. Use 18 version
    nvm use 18
5. DFX install 
    DFX_VERSION=0.14.1 sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
```
### Commands interacting with our canisters, npm run setup for short

```text
1. Starting the Local Internet Computer
    npm run start
    npm run clean-start
2. Deploying 
    npm run deploy
3. After deploying TokenListing Project WebUI board will be available on url for interacting with deployed app crud methods
    http://127.0.0.1:4943/?canisterId=bd3sg-teaaa-aaaaa-qaaba-cai&id=bkyz2-fmaaa-aaaaa-qaaaq-cai
4. Stop the canister
    npm run stop
```
