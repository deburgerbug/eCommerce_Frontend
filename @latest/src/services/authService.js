import { readJSON, writeJSON, removeKey } from "./storage";

const USERS_KEY = "users";
const SESSION_KEY = "session"

function makeSalt(){
    return crypto.randomUUID()
}


async function hashPassword(password, salt){
    const text = salt + password
    const bytes= new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes)

    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashText = hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");

    return hashText
}
function createUser(user){
    return {id: user.id, name: user.name, email: user.email}
}

function normalizedEmail(email){
    return email.trim().toLowerCase()
}
function saveSession(userId){
    writeJSON(SESSION_KEY, {userId: userId})
}

export function validateRegistration(name, email, password){
    if(name.trim().length <2) {
        return "Name must be more than 2 characters"
    }
    if(!email.includes('@') || !email.includes(".")) {
        return "Enter a valid email address"
    }
    if(password.length < 6){
        return "Password must be at least 6 characters"
    }
}

export async function registerUser(name, email, password){
    const errorMessage = validateRegistration(name, email, password);
    if(errorMessage){
        throw new Error(errorMessage)
    }

    const cleanEmail = normalizedEmail(email)
    const users = readJSON(USERS_KEY, [])

    const alreadyExists = users.find((user) => user.email === cleanEmail)
    if(alreadyExists){
        throw new Error("User with this email already exists");
    }

    const salt = makeSalt();
    const passwordHash = await hashPassword(password, salt);

    let biggestId = 0;
    console.log("users.....",users)
    for(const user of users){

        if(typeof  user.id === "number" && user.id >= biggestId ){
            console.log("I am inside..........")
            biggestId = user.id
            console.log("biggestId...." , biggestId)
            biggestId++
        }
    }
  
    const newUser = {
        id: biggestId,
        name: name.trim(),
        email: cleanEmail,
        passwordHash: passwordHash
    }

    users.push(newUser);
    writeJSON(USERS_KEY, users);

    saveSession(newUser.id)
    return createUser(newUser)
}

export async function loginUser(email,password){
    const cleanEmail = normalizedEmail(email)
    const users= readJSON(USERS_KEY, [])

    const user = users.find((u) => u.email === cleanEmail)
    if(!user){
        throw new Error(" No user found")
    }

    const typedHash = await hashPassword(password, user.salt);

    if(typedHash !== user.passwordHash){
        throw new Error("Invalid email or password.")
    }
}

export async function logoutUser(){
    removeKey(SESSION_KEY)
}

export  function getCurrentUser(){
    const session = readJSON(SESSION_KEY, null);
    if(session === null){
        return null
    }

    const users  = readJSON(USERS_KEY, []);
    const user = users.find((u) => u.id === session.userId)

    if(!user){
        removeKey(SESSION_KEY);
        return null
    }

    return createUser(user);
}