
export function readJSON(key, fallback){
    try{
        const text = localStorage.getItem(key);

        if(text=== null) {
            return fallback;
        }

        return JSON.parse(text)
    }catch{
        return fallback
    }
}

export function writeJSON(key, value){
    localStorage.setItem(key, JSON.stringify(value))
}

export function removeKey(key){
    localStorage.removeItem(key)
}
