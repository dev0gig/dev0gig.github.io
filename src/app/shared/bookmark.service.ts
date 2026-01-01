import { Injectable, signal, effect } from '@angular/core';
import { STORAGE_KEYS } from '../core/storage-keys.const';

export interface Bookmark {
    id: string;
    url: string;
    name: string;
    customIconUrl?: string;
    isFavorite: boolean;
    createdAt: number;
}

// Benutzerdefinierte Icons für bestimmte Lesezeichen
const DEFAULT_CUSTOM_ICONS: Record<string, string> = {
    "Gmail": "https://play-lh.googleusercontent.com/KSuaRLiI_FlDP8cM4MzJ23ml3og5Hxb9AapaGTMZ2GgR103mvJ3AAnoOFz1yheeQBBI=w240-h480-rw",
    "Google Cloud Console": "https://play-lh.googleusercontent.com/4_RW0mQ5mJhGGJVydTlQsQ0pnqAYq9UoTVm2_gElrgRM13Q02w43HPgYVaMFy4b4smmF=w240-h480-rw",
    "Google Docs": "https://play-lh.googleusercontent.com/emmbClh_hm0WpWZqJ0X59B8Pz1mKoB9HVLkYMktxhGE6_-30SdGoa-BmYW73RJ8MGZQ=w240-h480-rw",
    "Google Drive": "https://play-lh.googleusercontent.com/t-juVwXA8lDAk8uQ2L6d6K83jpgQoqmK1icB_l9yvhIAQ2QT_1XbRwg5IpY08906qEw=w240-h480-rw",
    "Google Kontakte": "https://play-lh.googleusercontent.com/fvhPW8dpGXM42Y-6aQU8Yl25L1l_mVgeoM-n08FxAkM7umAHkNs8wcs4MA49E67a7WVt=w240-h480-rw",
    "Google Maps": "https://play-lh.googleusercontent.com/Kf8WTct65hFJxBUDm5E-EpYsiDoLQiGGbnuyP6HBNax43YShXti9THPon1YKB6zPYpA=w240-h480-rw",
    "Google Messages": "https://play-lh.googleusercontent.com/9AZOTXU_CpreTFAXUPAmJNkm8VGCb1C90fjJ9pHGcVmpGMDSTq3cUbaQJdBT9Tdp9A=w240-h480-rw",
    "Google Sheets": "https://play-lh.googleusercontent.com/keE2gN0Hqh8-Tsf_RYZ_-yS2uo6ToqYVyRBv_UZaLXsgeeHBd2YPcEUWEF4DEtfGyb1h=w240-h480-rw",
    "Google Wallet": "https://play-lh.googleusercontent.com/DHBlQKvUNbopIS-VjQb3fUKQ_QH0Em-Q66AwG6LwD1Sach3lUvEWDb6hh8xNvKGmctU=w240-h480-rw",
    "Kalender": "https://play-lh.googleusercontent.com/_bh6XK3B7TAk7kBXC1GHC0j9eS9cw9wQo2K7fiP7FDGAQlcOqgUPT2lx3WgZ0JlOJh8=w240-h480-rw",
    "N26": "https://play-lh.googleusercontent.com/pCFXCIyrT0zxLral7LuFhBj6K2Bwl4Xj_zH_BXNKOJ7IJ2Gl8fE6cQ4IbQzX4uDSSw=w240-h480-rw",
    "NotebookLM": "https://play-lh.googleusercontent.com/qWDLmYCI4Lqzq8J-LhtvWvp1HIPkJb2lqkHjduXM7tnCo7N1tmKxnYdaX7CS2_5pkDuW=w240-h480-rw",
    "Notizen": "https://play-lh.googleusercontent.com/9bJoeaPbGTB8Tz_h4N-p-6ReRd8vSS-frZb2tmJulaGIoTKElKj3zpmcFJvnS96ANZP5=w240-h480-rw",
    "OneDrive": "https://play-lh.googleusercontent.com/pkzkr91OWFffdDGZ9706Ev2lxjM1pMizefY__r8JkCAtNVO-hmaMG2Qfx9ngpu7V7K4Yx_E7csAMl6fP7dGNS28=s48-rw",
    "opcyc": "https://res.cloudinary.com/dfcfhdy9c/image/upload/t_cards-logo-pad/f_auto/q_auto/v1736341461/opcyc_k8rfr5.png",
    "Post": "https://play-lh.googleusercontent.com/LCn0zMVjJXauMDNclMVMv8Ht-TNHHLqbCA61Xa7OR3X489dtOgpdFpzXT7H8KM_yTppO=s48-rw",
    "Prime Gaming": "https://yt3.googleusercontent.com/uRKrpN7-levqpjptf6nrIC406OVhVf4felZ3_WBWbGdrMa30J4-b_kFzAQj8ZymHjMdyFQcHGw=s900-c-k-c0x00ffffff-no-rj",
    "SmartMeter": "https://assets.kununu.com/media/prod/profiles/logos/ef562319-46f1-4b23-85e6-bf23be68c388_1_669fb75ad5ad7.gif",
    "Tasks": "https://play-lh.googleusercontent.com/pjUulZ-Vdo7qPKxk3IRhnk8SORPlgSydSyYEjm7fGcoXO8wDyYisWXwQqEjMryZ_sqK2=w240-h480-rw",
    "WhatsApp": "https://play-lh.googleusercontent.com/bYtqbOcTYOlgc6gqZ2rwb8lptHuwlNE75zYJu6Bn076-hTmvd96HH-6v7S0YUAAJXoJN=w240-h480-rw",
    "WienEnergie": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnPowqsn3fDxVC2TsvbrvIel8wHprfsqgS7A&s"
};

// Standard-Favoriten
const DEFAULT_FAVORITES: string[] = [
    "Gmail",
    "Google Gemini",
    "Kalender",
    "Notizen",
    "Outlook",
    "Reddit",
    "YouTube"
];

@Injectable({
    providedIn: 'root'
})
export class BookmarkService {
    bookmarks = signal<Bookmark[]>([]);

    private readonly DEFAULT_BOOKMARKS: { name: string, url: string, createdAt: number, isFavorite?: boolean }[] = [
        { name: '[DL] ALL Genshin PMX Models (ALWAYS UPDATING) by MarieMMD on DeviantArt', url: 'https://www.deviantart.com/mariemmd/art/DL-ALL-Genshin-PMX-Models-ALWAYS-UPDATING-945504849', createdAt: 1764340870000 },
        { name: 'A1', url: 'https://asmp.a1.net/asmp/LoginMasterServlet?userRequestURL=https%253A%252F%252Fwww.a1.net%252Fmein-a1&serviceRegistrationURL=&service=mein-a1-PROD&wrongLoginType=false&cookie=skip&level=10', createdAt: 1764400330000 },
        { name: 'Amazon', url: 'https://www.amazon.de/', createdAt: 1764400330000 },
        { name: 'Apple TV+', url: 'https://tv.apple.com/at', createdAt: 1764400330000 },
        { name: 'Bitpanda', url: 'https://account.bitpanda.com/login', createdAt: 1764400330000 },
        { name: 'Chess.com', url: 'https://www.chess.com/daily', createdAt: 1764400330000 },
        { name: 'CoinMarketCap', url: 'https://coinmarketcap.com/', createdAt: 1764400330000 },
        { name: 'EpicGames', url: 'https://store.epicgames.com/de/', createdAt: 1764400330000 },
        { name: 'ErsteBank', url: 'https://george.sparkasse.at/?at=c#/overview', createdAt: 1764400330000 },
        { name: 'FinanzOnline', url: 'https://finanzonline.bmf.gv.at/fon/', createdAt: 1764400330000 },
        { name: 'Flins rigged (Free) - Download Free 3D model by Aether36 (@ather36) [4900635]', url: 'https://sketchfab.com/3d-models/flins-rigged-free-4900635ff69f46f4a53bd49f1f2060bd', createdAt: 1764341510000 },
        { name: 'Fotos', url: 'https://photos.google.com/', createdAt: 1764400330000 },
        { name: 'Game8', url: 'https://game8.co/', createdAt: 1764506352000 },
        { name: 'github', url: 'https://github.com/dev0gig', createdAt: 1764400330000 },
        { name: 'Gmail', url: 'https://mail.google.com/mail/u/0/#inbox', createdAt: 1764400330000, isFavorite: true },
        { name: 'Google AI Studio', url: 'https://aistudio.google.com/prompts/new_chat', createdAt: 1764400330000 },
        { name: 'Google Cloud Console', url: 'https://console.cloud.google.com/', createdAt: 1764400330000 },
        { name: 'Google Docs', url: 'https://docs.google.com/document/u/0/', createdAt: 1764400330000 },
        { name: 'Google Drive', url: 'https://drive.google.com/drive/my-drive', createdAt: 1764400330000 },
        { name: 'Google Gemini', url: 'https://gemini.google.com/app', createdAt: 1764400330000, isFavorite: true },
        { name: 'Google Kontakte', url: 'https://contacts.google.com/', createdAt: 1764400330000 },
        { name: 'Google Maps', url: 'https://www.google.com/maps/@48.1419654,16.2101379,14z?entry=ttu&g_ep=EgoyMDI1MDkxMC4wIKXMDSoASAFQAw%3D%3D', createdAt: 1764400330000 },
        { name: 'Google Messages', url: 'https://messages.google.com/web/welcome', createdAt: 1764400330000 },
        { name: 'Google Play', url: 'https://play.google.com/store/games?device=windows&pli=1', createdAt: 1764400330000 },
        { name: 'Google Sheets', url: 'https://docs.google.com/spreadsheets/u/0/', createdAt: 1764400330000 },
        { name: 'Google Übersetzer', url: 'https://translate.google.com/?sl=de&tl=ja&op=translate', createdAt: 1764400330000 },
        { name: 'Google Wallet', url: 'https://wallet.google.com/wallet/home?utm_source=walletweb', createdAt: 1764400330000 },
        { name: 'Hockerty', url: 'https://www.hockerty.at/de-at/', createdAt: 1764400330000 },
        { name: 'HoYoLAB', url: 'https://www.hoyolab.com/home', createdAt: 1764400330000 },
        { name: 'iCloud Mail', url: 'https://www.icloud.com/mail/', createdAt: 1764400330000 },
        { name: 'itch.io', url: 'https://itch.io/', createdAt: 1764400330000 },
        { name: 'Kalender', url: 'https://calendar.google.com/calendar/u/0/r', createdAt: 1764400330000, isFavorite: true },
        { name: 'Lego', url: 'https://www.lego.com/de-at/member', createdAt: 1764400330000 },
        { name: 'MahjongSoul', url: 'https://mahjongsoul.game.yo-star.com/', createdAt: 1764400330000 },
        { name: 'Manscaped', url: 'https://eu.manscaped.com/de', createdAt: 1764400330000 },
        { name: 'MyHeritage', url: 'https://www.myheritage.at/', createdAt: 1764400330000 },
        { name: 'N26', url: 'https://app.n26.com/login', createdAt: 1764400330000 },
        { name: 'NotebookLM', url: 'https://notebooklm.google.com/?pli=1', createdAt: 1764400330000 },
        { name: 'Notizen', url: 'https://keep.google.com/', createdAt: 1764400330000, isFavorite: true },
        { name: 'OmniTools', url: 'https://omnitools.app/', createdAt: 1764400330000 },
        { name: 'OneDrive', url: 'https://onedrive.live.com/?view=0', createdAt: 1764400330000 },
        { name: 'opcyc', url: 'https://cu300078.opcyc.net/setup/', createdAt: 1764400330000 },
        { name: 'Outlook', url: 'https://outlook.live.com/mail/', createdAt: 1764400330000, isFavorite: true },
        { name: 'pCloud', url: 'https://my.pcloud.com/#/login', createdAt: 1764400330000 },
        { name: 'PDF24', url: 'https://tools.pdf24.org/de/alle-tools', createdAt: 1764400330000 },
        { name: 'Pinterest', url: 'https://at.pinterest.com/', createdAt: 1764400330000 },
        { name: 'Post', url: 'https://login.post.at/f098c632-5a55-45ba-9bf4-c13870157cf1/b2c_1a_signup_signin/oauth2/v2.0/authorize?client_id=c02d3813-d4b9-40a1-9db9-09e34cb9c2e1&redirect_uri=https%3A%2F%2Fwww.post.at%2Fsignin-oidc&response_type=code%20id_token&scope=openid%20profile&state=OpenIdConnect.AuthenticationProperties%3DlvTwsly70gNNGWCziqzfZLp3mDDcmM1crFH_mvMEEqAYDdZ5zcspZupB-WiSxAXb09RsheCQpslyIqILXu5z8EBpFnDBZHOV6gO2-WhIqpBa3-7bxJRJfZjG8TmMYJc5OkYGd7ej8ns3RK7gBdqzmuoy-nrsQ-3EANU0j0-GBHw88B-7SqNqdwUnkt95Ys441nsvlxXDATvK5SjVILJ-vuQfNTyF6w5t_PzjVpCy1uruPXLxo1SySkqonW7bWfcT6kj2T-heXjLRtU1qAfkjyTALxgOXAl4WGI8XSd9XigvbJOsAuuz_Tm41xa04Ol3tNX3KO8I--11OqsNfGXeRYMhNKUSpqc6ybN63jCsoHks&response_mode=form_post&nonce=638934689204904114.OTk2MDVkOWItN2ZmNC00ZGU0LWExZWEtZGNlNmVmMTVjNzEwNDkyMTQyYWYtZGMyOS00YmFmLTgyNmMtMmZlNzU4MDBmYjVl&post_logout_redirect_uri=https%3A%2F%2Fwww.post.at%2Fsitecore%2Flogin&lang=de&x-client-SKU=ID_NET461&x-client-ver=5.7.0.0', createdAt: 1764400330000 },
        { name: 'Prime Gaming', url: 'https://gaming.amazon.com/home', createdAt: 1764400330000 },
        { name: 'Reddit', url: 'https://www.reddit.com/', createdAt: 1764400330000 },
        { name: 'Revolut', url: 'https://sso.revolut.com/signin?client_id=o3r08ao16zvdlf2y5fdc&code_challenge=7EVFQ49eb3I_mM8CF4VSd5ZXTG0xKJ18eWYZrycWhas&code_challenge_method=S256&response_type=code&redirect_uri=https%3A%2F%2Fapp.revolut.com%2Fhome&response_mode=query&ui_color_scheme=dark&ui_locales=en&state=KPbgwrh2iBUue1C4', createdAt: 1764400330000 },
        { name: 'SmartMeter', url: 'https://smartmeter-web.wienernetze.at/uebersicht', createdAt: 1764400330000 },
        { name: 'Spielraum', url: 'https://www.spielraum.co.at/de', createdAt: 1764400330000 },
        { name: 'SSW', url: 'https://dev0gig.github.io/web-SSWTracker/', createdAt: 1764400330000 },
        { name: 'Steam', url: 'https://store.steampowered.com/', createdAt: 1764400330000 },
        { name: 'SunContracting', url: 'https://xserv.kdportal.de/login/?view=/show/Kunde_Vertraege', createdAt: 1764400330000 },
        { name: 'Tasks', url: 'https://tasks.google.com/tasks/', createdAt: 1764400330000 },
        { name: 'Temu', url: 'https://www.temu.com/', createdAt: 1764400330000 },
        { name: 'Thalia', url: 'https://www.thalia.at/', createdAt: 1764400330000 },
        { name: 'tolino', url: 'https://webreader.mytolino.com/library/index.html#/mybooks/titles', createdAt: 1764400330000 },
        { name: 'TradeRebulic', url: 'https://app.traderepublic.com/login', createdAt: 1764400330000 },
        { name: 'udemy', url: 'https://www.udemy.com/join/passwordless-auth/?next=%2Fhome%2Fmy-courses%2Flearning%2F&action=login&mode', createdAt: 1764400330000 },
        { name: 'WhatsApp', url: 'https://web.whatsapp.com/', createdAt: 1764400330000 },
        { name: 'WienEnergie', url: 'https://log.wien/auth/realms/logwien/protocol/openid-connect/auth?response_type=code&client_id=we-meine-we&state=UXozZWV0LmFCRXQwd3Vpdy1vNzM3MXIucS1yT0V5MTNkd3BjNlFlR3JKYWto&redirect_uri=https%3A%2F%2Fmeine.wienenergie.at%2Fprivat%2Fgateway%2Fauth&scope=openid&code_challenge=Zb-SFR4dP-DGFGL_6ICXnFTG39bVeP4LDtpaNOjPMfE&code_challenge_method=S256&nonce=UXozZWV0LmFCRXQwd3Vpdy1vNzM3MXIucS1yT0V5MTNkd3BjNlFlR3JKYWto', createdAt: 1764400330000 },
        { name: 'WienerStädtische', url: 'https://losleben.wienerstaedtische.at/app/login', createdAt: 1764400330000 },
        { name: 'WienMobil', url: 'https://www.wienmobil.at/en/monitor/PT', createdAt: 1764400330000 },
        { name: 'Willhaben', url: 'https://www.willhaben.at/iad', createdAt: 1764400330000 },
        { name: 'YouTube', url: 'https://www.youtube.com/', createdAt: 1764400330000, isFavorite: true }
    ];

    constructor() {
        this.loadBookmarks();

        effect(() => {
            this.saveBookmarks();
        });
    }

    private sortBookmarks(bookmarks: Bookmark[]): Bookmark[] {
        return bookmarks.sort((a, b) => a.name.localeCompare(b.name));
    }

    private loadBookmarks() {
        const saved = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Wende Defaults an für bestehende Lesezeichen
                    const updatedBookmarks = parsed.map((b: Bookmark) => this.applyDefaults(b));
                    this.bookmarks.set(this.sortBookmarks(updatedBookmarks));
                    return;
                }
            } catch (e) {
                console.error('Failed to parse bookmarks', e);
            }
        }

        // Load defaults if no saved bookmarks or parsing failed/empty
        this.importBookmarks(this.DEFAULT_BOOKMARKS);
    }

    /**
     * Wendet DEFAULT_CUSTOM_ICONS und DEFAULT_FAVORITES auf ein Lesezeichen an,
     * sofern keine benutzerdefinierten Werte vorhanden sind.
     */
    private applyDefaults(bookmark: Bookmark): Bookmark {
        const result = { ...bookmark };

        // Benutzerdefiniertes Icon anwenden, wenn kein customIconUrl gesetzt ist
        if (!result.customIconUrl && DEFAULT_CUSTOM_ICONS[result.name]) {
            result.customIconUrl = DEFAULT_CUSTOM_ICONS[result.name];
        }

        // isFavorite auf true setzen, wenn Name in DEFAULT_FAVORITES und noch nicht explizit gesetzt
        // Prüfe ob isFavorite undefined oder false ist (bei false prüfen wir ob der Name in den Defaults ist)
        if (DEFAULT_FAVORITES.includes(result.name) && !result.isFavorite) {
            result.isFavorite = true;
        }

        return result;
    }

    private saveBookmarks() {
        localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(this.bookmarks()));
    }

    addBookmark(url: string, name: string, customIconUrl?: string) {
        // Ensure URL has protocol
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const newBookmark: Bookmark = {
            id: crypto.randomUUID(),
            url,
            name,
            customIconUrl,
            isFavorite: false,
            createdAt: Date.now()
        };

        this.bookmarks.update(current => this.sortBookmarks([newBookmark, ...current]));
    }

    updateBookmark(id: string, updates: Partial<Bookmark>) {
        this.bookmarks.update(current => {
            const updated = current.map(b => b.id === id ? { ...b, ...updates } : b);
            return this.sortBookmarks(updated);
        });
    }

    removeBookmark(id: string) {
        this.bookmarks.update(current => current.filter(b => b.id !== id));
    }

    toggleFavorite(id: string) {
        this.bookmarks.update(current =>
            current.map(b => b.id === id ? { ...b, isFavorite: !b.isFavorite } : b)
        );
    }

    getFaviconUrl(url: string): string {
        try {
            const domain = new URL(url).hostname;
            return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        } catch {
            return ''; // Fallback or handle invalid URL
        }
    }

    importBookmarks(newBookmarks: { url: string; name: string; customIconUrl?: string; createdAt?: number; isFavorite?: boolean; id?: string }[], replace: boolean = false) {
        const bookmarksToAdd: Bookmark[] = newBookmarks.map(b => {
            let url = b.url;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            const bookmark: Bookmark = {
                id: b.id || crypto.randomUUID(),
                url,
                name: b.name,
                customIconUrl: b.customIconUrl,
                isFavorite: b.isFavorite || false,
                createdAt: b.createdAt || Date.now()
            };
            // Wende Defaults an
            return this.applyDefaults(bookmark);
        });

        if (replace) {
            this.bookmarks.set(this.sortBookmarks(bookmarksToAdd));
        } else {
            this.bookmarks.update(current => this.sortBookmarks([...bookmarksToAdd, ...current]));
        }
    }

    clearAllBookmarks() {
        this.bookmarks.set([]);
    }

    /**
     * Returns bookmark data for backup export (used by BackupService)
     */
    getExportData(): Bookmark[] {
        return this.bookmarks();
    }
}
