import axios from "axios";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import queryString from "query-string";

dotenv.config();
const authRoutes = express.Router();
const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.REDIRECT_URI;
var stateKey = "spotify_auth_state";

authRoutes.use(express.json());
authRoutes.use(express.urlencoded({ extended: true }));
authRoutes.use(cookieParser());

function generateRandomString(length) {
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

authRoutes.get("/login", async (req, res) => {
  var state = generateRandomString(16);
  res.cookie(stateKey, state);
  var scope = "playlist-modify-public playlist-modify-private";

  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      queryString.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      })
  );
});

authRoutes.get("/callback", async (req, res) => {
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  try {
    if (state === null || state !== storedState) {
      res.redirect(
        "/#" +
          queryString.stringify({
            error: "state_mismatch",
          })
      );
    } else {
      res.clearCookie(stateKey);

      const tokenResponse = await axios.post(
        "https://accounts.spotify.com/api/token",
        queryString.stringify({
          code: code,
          redirect_uri: redirect_uri,
          grant_type: "authorization_code",
        }),
        {
          headers: {
            "content-type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(
              `${client_id}:${client_secret}`
            ).toString("base64")}`,
          },
        }
      );

      if (tokenResponse.status == 200) {
        var access_token = tokenResponse.data.access_token;
        var refresh_token = tokenResponse.data.refresh_token;

        res.cookie("access_token", access_token, {
          maxAge: 3600000,
        });
        res.cookie("refresh_token", refresh_token);

        res.redirect("http://localhost:5173/edit");
      } else {
        res.redirect(
          "/#" +
            queryString.stringify({
              error: "invalid_token",
            })
        );
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

authRoutes.get("/refresh_token", async (req, res) => {
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
    json: true,
  };

  try {
    const response = await axios.post(
      authOptions.url,
      queryString.stringify(authOptions.form),
      { headers: authOptions.headers }
    );

    if (response.status === 200) {
      var access_token = response.data.access_token;
      res.send({ access_token: access_token });
    }
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error" });
  }
});

export default authRoutes;
