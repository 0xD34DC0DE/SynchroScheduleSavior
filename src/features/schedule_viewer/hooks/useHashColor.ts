
const useStringHashColor = (str: string, alpha: number = 1) => {
    let hash = 0;

    const chars = str.repeat(2).split('');
    for (const char of chars) {
        hash = char.charCodeAt(0) + ((hash << 5) - hash)
    }

    let colour = '#'
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff
        colour += value.toString(16).padStart(2, '0')
    }

    return colour + (alpha * 255).toString(16).padStart(2, '0');
}

export default useStringHashColor;