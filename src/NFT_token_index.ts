// Import necessary modules
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

/**
 * This type provides details of listed NFT token on a board.
 */
type ListedToken = Record<{
    id: string;
    tokenId: string;
    tokenName: string;
    body: string;
    pinataURL: string;
    currentlyListed: boolean;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

// Define the payload for creating a new ListedToken
type ListedTokenPayload = Record<{
    tokenId: string;
    tokenName: string;
    body: string;
    pinataURL: string;
}>

// Create storage for listed tokens
const tokenStorage = new StableBTreeMap<string, ListedToken>(0, 44, 1024);

// Function to get all listed tokens
$query;
export function getListedTokens(): Result<Vec<ListedToken>, string> {
    // Filter tokens to return only the currently listed ones
    const listedTokens = tokenStorage.values().filter(token => token.currentlyListed);

    try {
        return Result.Ok(listedTokens);
    } catch (error) {
        return Result.Err(`Failed to get listed tokens: ${error}`);
    }
}

// Function to get a specific listed token by ID
$query;
export function getListedToken(id: string): Result<ListedToken, string> {
    // Validate the input id
    if (id === null || id === undefined || typeof id !== 'string') {
        return Result.Err<ListedToken, string>('Invalid id');
    }

    // Retrieve the listedToken from tokenStorage
    try {
        return match(tokenStorage.get(id), {
            Some: (listedToken) => Result.Ok<ListedToken, string>(listedToken),
            None: () => Result.Err<ListedToken, string>(`A listedToken with id=${id} not found`)
        });
    } catch (error) {
        return Result.Err<ListedToken, string>(`Error retrieving listedToken with id=${id}`);
    }
}

// Function to check if a token is currently listed
$query;
export function isTokenCurrentlyListed(id: string): Result<boolean, string> {
    // Validate the id parameter
    if (typeof id !== 'string') {
        return Result.Err<boolean, string>('Invalid id parameter');
    }

    try {
        // Handle possible exceptions
        const listedToken = tokenStorage.get(id);
        return match(listedToken, {
            Some: (token) => Result.Ok<boolean, string>(token.currentlyListed),
            None: () => Result.Err<boolean, string>(`Listed token with id ${id} not found`)
        });
    } catch (error) {
        return Result.Err<boolean, string>(`Error retrieving listed token with id ${id}: ${error}`);
    }
}

// Function to get the IPFS URL for a listed token
$query;
export function getNFTPinataIPFSurl(id: string): Result<string, string> {
    try {
        if (typeof id !== 'string') {
            return Result.Err<string, string>('Invalid id');
        }
        return match(tokenStorage.get(id), {
            Some: (listedToken) => Result.Ok<string, string>(listedToken.pinataURL),
            None: () => Result.Err<string, string>(`A listedToken with id=${id} not found`)
        });
    } catch (error) {
        return Result.Err<string, string>(`An error occurred while retrieving the listedToken with id=${id}: ${error}`);
    }
}

// Function to add a new listed token
$update;
export function addListedToken(payload: ListedTokenPayload): Result<ListedToken, string> {
    if (!payload.tokenId || !payload.tokenName || !payload.body || !payload.pinataURL) {
        return Result.Err("Invalid payload");
    }

    try {
        // Create a new listed token object
        const token: ListedToken = {
            id: uuidv4(),
            tokenId: payload.tokenId,
            tokenName: payload.tokenName,
            body: payload.body,
            pinataURL: payload.pinataURL,
            currentlyListed: true,
            createdAt: ic.time(),
            updatedAt: Opt.None
        };
        tokenStorage.insert(token.id, token);
        return Result.Ok(token);
    } catch (error) {
        return Result.Err(`Error occurred during token insertion: ${error}`);
    }
}

// Function to update an existing listed token
$update;
export function updateListedToken(id: string, payload: ListedTokenPayload): Result<ListedToken, string> {

    if (!payload.tokenId || !payload.tokenName || !payload.body || !payload.pinataURL) {
        return Result.Err("Invalid payload");
    }

    return match(tokenStorage.get(id), {
        Some: (listedToken) => {
            // Create an updated listed token object
            const updatedListedToken: ListedToken = {
                ...listedToken,
                tokenId: payload.tokenId,
                tokenName: payload.tokenName,
                body: payload.body,
                pinataURL: payload.pinataURL,
                updatedAt: Opt.Some(ic.time())
            };
            try {
                // Update the listed token in the storage
                tokenStorage.insert(listedToken.id, updatedListedToken);
                return Result.Ok<ListedToken, string>(updatedListedToken);
            } catch (error) {
                return Result.Err<ListedToken, string>(`Error occurred during token insertion of updatedListedToken into tokenStorage`);
            }
        },
        None: () => Result.Err<ListedToken, string>(`Couldn't update a listedToken with id=${id}. listedToken not found`)
    });
}

// Function to unlist a token
$update;
export function unlistToken(id: string): Result<ListedToken, string> {
    return match(tokenStorage.get(id), {
        Some: (listedToken) => {
            // Create an updated listed token with currentlyListed set to false
            const updatedListedToken: ListedToken = { ...listedToken, currentlyListed: false, updatedAt: Opt.Some(ic.time()) };
            tokenStorage.insert(listedToken.id, updatedListedToken);
            return Result.Ok<ListedToken, string>(updatedListedToken);
        },
        None: () => Result.Err<ListedToken, string>(`Couldn't update a listedToken with id=${id}. listedToken not found`)
    });
}

// Function to delete a listed token by ID
$update;
export function deleteListedToken(id: string): Result<ListedToken, string> {
    // Validate the id parameter
    if (!id) {
        return Result.Err<ListedToken, string>('id parameter is required.');
    }

    // Handle exceptions during deletion process
    try {
        return match(tokenStorage.remove(id), {
            Some: (deletedListedToken) => Result.Ok<ListedToken, string>(deletedListedToken),
            None: () => Result.Err<ListedToken, string>(`Couldn't delete a listedToken with id=${id}. listedToken not found.`)
        });
    } catch (error) {
        return Result.Err<ListedToken, string>(`An error occurred while deleting the listedToken with id=${id}: ${error}`);
    }
}

// A workaround to make the uuid package work with Azle
globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32)

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256)
        }

        return array
    }
}
