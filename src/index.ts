// Import necessary modules
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

/**
 * This type represents a message that can be listed on a board.
 * This type provides details of a listed NFT token.
 */
type Message = Record<{
    id: string;
    title: string;
    body: string;
    attachmentURL: string;
    createdAt: nat64;
    updatedAt: Opt<nat64>;
}>

// Define the payload for creating a new Message
type MessagePayload = Record<{
    title: string;
    body: string;
    attachmentURL: string;
}>

// Create storage for messages
const messageStorage = new StableBTreeMap<string, Message>(0, 44, 1024);

// Function to get all messages
$query;
export function getMessages(): Result<Vec<Message>, string> {
    try {
        return Result.Ok(messageStorage.values());
    } catch (error) {
        return Result.Err(`An error occurred when retrieving messages: ${error}`);
    }
}

// Function to get a specific message by ID
$query;
export function getMessage(id: string): Result<Message, string> {
    // Validate the provided ID
    if (!id) {
        return Result.Err<Message, string>('Invalid id');
    }
    try {
        return match(messageStorage.get(id), {
            Some: (message) => Result.Ok<Message, string>(message),
            None: () => Result.Err<Message, string>(`An error occurred while retrieving the message with id=${id}`)
        });
    } catch (error) {
        return Result.Err<Message, string>(`An error occurred while retrieving the message.`);
    }
}

// Function to add a new message
$update;
export function addMessage(payload: MessagePayload): Result<Message, string> {
    // Validate the payload
    if (!payload.title || !payload.body || !payload.attachmentURL) {
        return Result.Err("Invalid payload");
    }

    // Create a new message object
    const message: Message = {
        id: uuidv4(),
        createdAt: ic.time(),
        updatedAt: Opt.None,
        title: payload.title,
        body: payload.body,
        attachmentURL: payload.attachmentURL
    };

    // Check if a message with the same id already exists
    if (messageStorage.get(message.id)) {
        return Result.Err<Message, string>(`A message with the same id already exists.`);
    }

    try {
        // Insert the message into the storage
        messageStorage.insert(message.id, message);
    } catch (error) {
        return Result.Err<Message, string>(`An error occurred while inserting the message into storage.`);
    }

    // Return the result
    return Result.Ok(message);
}

// Function to update an existing message
$update;
export function updateMessage(id: string, payload: MessagePayload): Result<Message, string> {
    // Validate the input parameters
    if (typeof id !== 'string') {
        return Result.Err<Message, string>('id must be a string');
    }

    if (typeof payload.title !== 'string') {
        return Result.Err<Message, string>('payload.title must be a string');
    }
    if (typeof payload.body !== 'string') {
        return Result.Err<Message, string>('payload.body must be a string');
    }
    if (typeof payload.attachmentURL !== 'string') {
        return Result.Err<Message, string>('payload.attachmentURL must be a string');
    }

    return match(messageStorage.get(id), {
        Some: (message) => {
            // Create an updated message object
            const updatedMessage: Message = {
                id: message.id,
                title: payload.title,
                body: payload.body,
                attachmentURL: payload.attachmentURL,
                createdAt: message.createdAt,
                updatedAt: Opt.Some(ic.time())
            };
            try {
                // Update the message in the storage
                messageStorage.insert(message.id, updatedMessage);
                return Result.Ok<Message, string>(updatedMessage);
            } catch (error) {
                return Result.Err<Message, string>(`An error occurred while inserting the updated message into storage.`);
            }

        },
        None: () => Result.Err<Message, string>(`couldn't update a message with id=${id}. message not found`)
    });
}

// Function to delete a message by ID
$update;
export function deleteMessage(id: string): Result<Message, string> {
    // Suggestion 1: Consider adding type checking for the `id` parameter to ensure it's a string.
    if (typeof id !== 'string') {
        return Result.Err<Message, string>('id must be a string');
    }

    // Suggestion 2: Consider adding a check to see if the `id` is not empty or null before attempting to delete.
    if (!id) {
        return Result.Err<Message, string>('id is empty or null');
    }

    try {
        // Suggestion 3: Consider wrapping the deletion operation in a try-catch block to handle any unexpected errors.
        const deletedMessage = messageStorage.remove(id);
        return match(deletedMessage, {
            Some: (message) => Result.Ok<Message, string>(message),
            None: () => Result.Err<Message, string>(`couldn't delete a message with id=${id}. message not found.`)
        });
    } catch (error) {
        return Result.Err<Message, string>(`an unexpected error occurred while deleting the message with id=${id}.`);
    }
}

// Configure the UUID Package
// A workaround to make the uuid package work with Azle
globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32);

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }

        return array;
    }
}
