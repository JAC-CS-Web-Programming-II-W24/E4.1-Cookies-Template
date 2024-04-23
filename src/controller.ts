import { IncomingMessage, ServerResponse } from "http";
import { database } from "./model";
import { renderTemplate } from "./view";

export const getHome = async (req: IncomingMessage, res: ServerResponse) => {
    const cookies = getCookies(req);
    const language =
        cookies.language === Language.English ||
        cookies.language === Language.French
            ? cookies.language
            : Language.English;

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    res.end(
        await renderTemplate("src/views/HomeView.hbs", {
            title: language === Language.French ? "Bienvenue" : "Welcome",
            menu: getMenu(language),
            languages: getLanguages(language),
        }),
    );
};

export const changeLanguage = async (
    req: IncomingMessage,
    res: ServerResponse,
) => {
    const body = await parseBody(req);
    const language = body.split("=")[1] as Language;

    res.statusCode = 302;
    res.setHeader("Set-Cookie", `language=${language}; SameSite=Strict`);
    res.setHeader("Location", req.headers.referer || "/");
    res.end();
};

export const getOnePokemon = async (
    req: IncomingMessage,
    res: ServerResponse,
) => {
    const id = Number(req.url?.split("/")[2]);
    const foundPokemon = database.find((pokemon) => pokemon.id === id);
    const cookies = getCookies(req);
    const language =
        cookies.language === Language.English ||
        cookies.language === Language.French
            ? cookies.language
            : Language.English;

    if (!foundPokemon) {
        res.statusCode = 404;
        res.end(
            await renderTemplate("src/views/ErrorView.hbs", {
                title: language === Language.French ? "Erreur" : "Error",
                message:
                    language === Language.French
                        ? "Pokémon non trouvé"
                        : "Pokémon not found",
            }),
        );
        return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    res.end(
        await renderTemplate("src/views/ShowView.hbs", {
            name: foundPokemon.name[language],
            type: foundPokemon.type[language],
            info: foundPokemon.info[language],
            image: foundPokemon.image,
            menu: getMenu(language),
            languages: getLanguages(language),
        }),
    );
};

export const getAllPokemon = async (
    req: IncomingMessage,
    res: ServerResponse,
) => {
    const cookies = getCookies(req);
    const language =
        cookies.language === Language.English ||
        cookies.language === Language.French
            ? cookies.language
            : Language.English;

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    res.end(
        await renderTemplate("src/views/ListView.hbs", {
            title:
                language === Language.French ? "Toute Pokemon" : "All Pokemon",
            pokemon: database.map((pokemon) => ({
                id: pokemon.id,
                name: pokemon.name[language],
                type: pokemon.type[language],
                image: pokemon.image,
            })),
            menu: getMenu(language),
            languages: getLanguages(language),
        }),
    );
};

const parseBody = async (req: IncomingMessage) => {
    return new Promise<string>((resolve) => {
        let body = "";

        req.on("data", (chunk) => {
            body += chunk.toString();
        });

        req.on("end", () => {
            resolve(body);
        });
    });
};

/**
 * @returns The cookies of the request as a Record type object.
 * @example name=Pikachu;type=Electric => [{ name: "name", value: "Pikachu" }, { name: "type", value: "Electric" }]
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cookie
 * @see https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type
 */
const getCookies = (req: IncomingMessage) => {
    const cookieHeader = req.headers.cookie;
    const cookies: Record<string, string> = {};

    if (cookieHeader) {
        cookieHeader.split(";").forEach((cookie) => {
            const [name, value] = cookie.split("=");
            cookies[name.trim()] = value.trim();
        });
    }

    return cookies;
};

export enum Language {
    English = "en",
    French = "fr",
}

const getMenu = (language: Language) => {
    const menus = {
        [Language.English]: {
            home: "Home",
            list: "List all",
        },
        [Language.French]: {
            home: "Accueil",
            list: "Tout lister",
        },
    };

    return menus[language];
};

const getLanguages = (language: Language) => {
    return [
        {
            shortName: "en",
            longName: language === "en" ? "🇬🇧 English" : "🇬🇧 Anglais",
            isSelected: language === "en" ? "selected" : "",
        },
        {
            shortName: "fr",
            longName: language === "fr" ? "🇫🇷 Français" : "🇫🇷 French",
            isSelected: language === "fr" ? "selected" : "",
        },
    ];
};
