
export const stringHashToHTMLColor = (str: string, alpha: number = 1) => {
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

export const textColorContrast = (hexcolor: string): 'black' | 'white' => {
    const r = parseInt(hexcolor.substring(1, 3), 16);
    const g = parseInt(hexcolor.substring(3, 5), 16);
    const b = parseInt(hexcolor.substring(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}