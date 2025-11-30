import { Injectable, signal, effect } from '@angular/core';

export interface Bookmark {
    id: string;
    url: string;
    name: string;
    isFavorite: boolean;
    createdAt: number;
}

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
        const saved = localStorage.getItem('dev0gig_bookmarks');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.bookmarks.set(this.sortBookmarks(parsed));
                    return;
                }
            } catch (e) {
                console.error('Failed to parse bookmarks', e);
            }
        }

        // Load defaults if no saved bookmarks or parsing failed/empty
        this.importBookmarks(this.DEFAULT_BOOKMARKS);
    }

    private saveBookmarks() {
        localStorage.setItem('dev0gig_bookmarks', JSON.stringify(this.bookmarks()));
    }

    addBookmark(url: string, name: string) {
        // Ensure URL has protocol
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const newBookmark: Bookmark = {
            id: crypto.randomUUID(),
            url,
            name,
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

    importBookmarks(newBookmarks: { url: string; name: string; createdAt?: number; isFavorite?: boolean }[]) {
        const bookmarksToAdd: Bookmark[] = newBookmarks.map(b => {
            let url = b.url;
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            return {
                id: crypto.randomUUID(),
                url,
                name: b.name,
                isFavorite: b.isFavorite || false,
                createdAt: b.createdAt || Date.now()
            };
        });

        this.bookmarks.update(current => this.sortBookmarks([...bookmarksToAdd, ...current]));
    }
}
