// Canister code goes here
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

/**
 * This type provides details of a listed NFT token on a board.
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

type ListedTokenPayload = Record<{
    tokenId: string;
    tokenName: string;
    body: string;
    pinataURL: string;
}>

const tokenStorage = new StableBTreeMap<string, ListedToken>(0, 44, 1024);

$query;
export function getListedTokens(): Result<Vec<ListedToken>, string> {
    return Result.Ok(tokenStorage.values());
}

$query;
export function getListedToken(id: string): Result<ListedToken, string> {
    const listedToken = tokenStorage.get(id);
    if (listedToken === null) {
        return Result.Err<ListedToken, string>(`A listedToken with id=${id} not found`);
    }
    return Result.Ok(listedToken);
}

$query;
export function getStatusListedTokenCurrentlyListed(id: string): Result<boolean, string> {
    const listedToken = tokenStorage.get(id);
    if (listedToken === null) {
        return Result.Err<boolean, string>(`A listedToken with id=${id} not found`);
    }
    return Result.Ok(listedToken.currentlyListed);
}

$query;
export function getNFTPinataIPFSurl(id: string): Result<string, string> {
    const listedToken = tokenStorage.get(id);
    if (listedToken === null) {
        return Result.Err<string, string>(`A listedToken with id=${id} not found`);
    }
    return Result.Ok(listedToken.pinataURL);
}

$update;
export function addListedToken(payload: ListedTokenPayload): Result<ListedToken, string> {
    if (!payload.tokenId || !payload.tokenName || !payload.body || !payload.pinataURL) {
        return Result.Err<ListedToken, string>("Missing required fields in payload");
    }
    const token: ListedToken = { id: uuidv4(), currentlyListed: true, createdAt: ic.time(), updatedAt: Opt.None, ...payload };
    tokenStorage.insert(token.id, token);
    return Result.Ok(token);
}

$update;
export function updateListedToken(id: string, payload: ListedTokenPayload): Result<ListedToken, string> {
    const listedToken = tokenStorage.get(id);
    if (listedToken === null) {
        return Result.Err<ListedToken, string>(`A listedToken with id=${id} not found`);
    }
    if (!payload.tokenId || !payload.tokenName || !payload.body || !payload.pinataURL) {
        return Result.Err<ListedToken, string>("Missing required fields in payload");
    }
    const updatedListedToken: ListedToken = { ...listedToken, ...payload, updatedAt: Opt.Some(ic.time()) };
    tokenStorage.insert(listedToken.id, updatedListedToken);
    return Result.Ok(updatedListedToken);
}

$update;
export function unlistToken(id: string): Result<ListedToken, string> {
    const listedToken = tokenStorage.get(id);
    if (listedToken === null) {
        return Result.Err<ListedToken, string>(`A listedToken with id=${id} not found`);
    }
    listedToken.currentlyListed = false;
    listedToken.updatedAt = Opt.Some(ic.time());
    tokenStorage.insert(listedToken.id, listedToken);
    return Result.Ok(listedToken);
}

$update;
export function deleteListedToken(id: string): Result<ListedToken, string> {
    const deletedListedToken = tokenStorage.remove(id);
    if (deletedListedToken === null) {
        return Result.Err<ListedToken, string>(`A listedToken with id=${id} not found`);
    }
    return Result.Ok(deletedListedToken);
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
