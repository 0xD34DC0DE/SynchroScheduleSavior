const useTextContrastColor = (htmlColor: string): 'black' | 'white' => {
    const r = parseInt(htmlColor.substring(1, 3), 16);
    const g = parseInt(htmlColor.substring(3, 5), 16);
    const b = parseInt(htmlColor.substring(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}

export default useTextContrastColor;