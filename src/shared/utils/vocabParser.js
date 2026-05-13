export default class VocabParser {
    constructor(section) {
        this.section = section;
    }

    static parse(section) {
        return new VocabParser(section).parse();
    }

    parse() {
        if (this._hasItems()) return this._fromItems();
        if (this.section.content) return this._fromContent(this.section.content);
        if (this.section.html) return this._fromHTML(this.section.html);
        return [];
    }

    // ---------------------------
    // SOURCE 1: ITEMS (cleanest)
    // ---------------------------
    _hasItems() {
        return Array.isArray(this.section.items) && this.section.items.length > 0;
    }

    _fromItems() {
        return this.section.items.map(item => ({
            english: this._clean(item.english),
            phonemic: this._clean(item.phonemic),
            khmer: this._clean(item.khmer)
        }));
    }

    // ---------------------------
    // SOURCE 2: CONTENT (TEXT)
    // ---------------------------
    _fromContent(content) {
        return content
            .split('\n')
            .map(line => this._parseLine(line))
            .filter(Boolean);
    }

    _parseLine(line) {
        const match = line.match(/\*\s(.+?)\s\[(.+?)\]\s:\s(.+)/);

        if (!match) return null;

        return {
            english: this._clean(match[1]),
            phonemic: this._clean(match[2]),
            khmer: this._clean(match[3])
        };
    }

    // ---------------------------
    // SOURCE 3: HTML (fallback)
    // ---------------------------
    _fromHTML(html) {
        // strip tags but keep readable structure
        const text = html
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<\/p>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .trim();

        return this._fromContent(text);
    }

    // ---------------------------
    // HELPERS
    // ---------------------------
    _clean(str) {
        return (str || "")
            .replace(/\*/g, "")
            .replace(/\s+/g, " ")
            .trim();
    }

    // ---------------------------
    // UTIL METHODS
    // ---------------------------
    getEnglish() {
        return this.parse().map(v => v.english);
    }

    getKhmer() {
        return this.parse().map(v => v.khmer);
    }

    search(keyword) {
        const k = keyword.toLowerCase();

        return this.parse().filter(v =>
            v.english.toLowerCase().includes(k) ||
            v.khmer.includes(keyword)
        );
    }

    count() {
        return this.parse().length;
    }
}

export function parse(section) {
    throw new Error('Function not implemented.');
}
