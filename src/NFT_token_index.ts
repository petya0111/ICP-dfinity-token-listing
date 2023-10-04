// cannister code goes here
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
    return match(tokenStorage.get(id), {
        Some: (listedToken) => Result.Ok<ListedToken, string>(listedToken),
        None: () => Result.Err<ListedToken, string>(`a listedToken with id=${id} not found`)
    });
}

$query;
export function getStatusListedTokenCurrentlyListed(id: string): Result<boolean, string> {
    return match(tokenStorage.get(id), {
        Some: (listedToken) => Result.Ok<boolean, string>(listedToken.currentlyListed),
        None: () => Result.Err<boolean, string>(`a listedToken with id=${id} not found`)
    });
}

$query;
export function getNFTPinataIPFSurl(id: string): Result<string, string> {
    return match(tokenStorage.get(id), {
        Some: (listedToken) => Result.Ok<string, string>(listedToken.pinataURL),
        None: () => Result.Err<string, string>(`a listedToken with id=${id} not found`)
    });
}

$update;
export function addListedToken(payload: ListedTokenPayload): Result<ListedToken, string> {
    const token: ListedToken = { id: uuidv4(), currentlyListed: true, createdAt: ic.time(), updatedAt: Opt.None, ...payload };
    tokenStorage.insert(token.id, token);
    return Result.Ok(token);
}

$update;
export function updateListedToken(id: string, payload: ListedTokenPayload): Result<ListedToken, string> {
    return match(tokenStorage.get(id), {
        Some: (listedToken) => {
            const updatedListedToken: ListedToken = {...listedToken, ...payload, updatedAt: Opt.Some(ic.time())};
            tokenStorage.insert(listedToken.id, updatedListedToken);
            return Result.Ok<ListedToken, string>(updatedListedToken);
        },
        None: () => Result.Err<ListedToken, string>(`couldn't update a listedToken with id=${id}. listedToken not found`)
    });
}
$update;
export function unlistToken(id: string): Result<ListedToken, string> {
    return match(tokenStorage.get(id), {
        Some: (listedToken) => {
            const updatedListedToken: ListedToken = {...listedToken, currentlyListed: false, updatedAt: Opt.Some(ic.time())};
            tokenStorage.insert(listedToken.id, updatedListedToken);
            return Result.Ok<ListedToken, string>(updatedListedToken);
        },
        None: () => Result.Err<ListedToken, string>(`couldn't update a listedToken with id=${id}. listedToken not found`)
    });
}

$update;
export function deleteListedToken(id: string): Result<ListedToken, string> {
    return match(tokenStorage.remove(id), {
        Some: (deletedListedToken) => Result.Ok<ListedToken, string>(deletedListedToken),
        None: () => Result.Err<ListedToken, string>(`couldn't delete a listedToken with id=${id}. listedToken not found.`)
    });
}

// a workaround to make uuid package work with Azle
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