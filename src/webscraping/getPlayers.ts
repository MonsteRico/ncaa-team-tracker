import { type Browser } from "puppeteer";
import { eq } from "drizzle-orm";
import { colleges, type College } from "@/server/db/schema";
import type { InsertPlayer } from "@/server/db/schema";
import { db } from "@/server/db/";
export async function getNewSignees(
  college: College,
  browser: Browser,
): Promise<InsertPlayer[]> {
  const page = await browser.newPage();
  await page.goto(
    `https://247sports.com/college/${college.collegeId}/season/2024-basketball/commits/`,
    {
      waitUntil: "domcontentloaded",
    },
  );

  // if the page has an element of ri-page__list-item ri-page__list-item--no-results, return []
  if (
    (await page.$(".ri-page__list-item.ri-page__list-item--no-results")) !==
    null
  ) {
    return [];
  }

  const signedRows = await page.$$(".ri-page__list-item:not(.list-header)");
  const players: InsertPlayer[] = [];
  for (const row of signedRows) {
    let image = await row.$eval(".circle-image-block img", (img) =>
      img.getAttribute("src"),
    );
    while (!image || image.includes("1x1")) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      image = await row.$eval(".circle-image-block img", (img) =>
        img.getAttribute("src"),
      );
    }
    // remove query string from image url
    image = image.split("?")[0] ?? null;
    const starRating = await row.$$eval(
      ".ri-page__star-and-score .icon-starsolid.yellow",
      (stars) => stars.length,
    );
    const name = await row.$eval(".ri-page__name-link", (name) =>
      name.innerHTML.trim(),
    );
    const position = await row.$eval(".position", (position) =>
      position.innerHTML.trim(),
    );
    const status = await row.$eval(".status .commit-date", (status) =>
      status.innerHTML.trim(),
    );
    const highSchool = await row.$eval(".recruit .meta", (school) =>
      school.innerHTML.trim().split("(")[0]?.trim(),
    );
    const nationalRating = await row.$eval(".natrank", (rating) => {
      return isNaN(parseInt(rating.innerHTML.trim()))
        ? null
        : parseInt(rating.innerHTML.trim());
    });
    let playerPage = await row.$eval(".ri-page__name-link", (link) =>
      link.getAttribute("href"),
    );
    if (!playerPage?.includes("https://247sports.com")) {
      playerPage = `https:${playerPage}`;
    }
    const player: InsertPlayer = {
      name,
      image,
      position,
      status,
      highSchool,
      currentCollegeId: college.collegeId,
      newCollegeId: college.collegeId,
      previousCollegeId: null,
      playerId: getPlayerIdFromUrl(playerPage) ?? Bun.hash(name).toString(),
      nationalRating,
      playerPage,
      starRating: !Number.isNaN(starRating) ? starRating : null,
    };
    players.push(player);
  }

  return players;
}

export async function getTransferredPlayers(
  college: College,
  browser: Browser,
): Promise<InsertPlayer[]> {
  const players: InsertPlayer[] = [];
  const page = await browser.newPage();
  await page.goto(
    `https://247sports.com/college/${college.collegeId}/season/2024-basketball/transferportal/`,
    {
      waitUntil: "domcontentloaded",
    },
  );
  // Extracting information for transferred players
  const transferGroups = await page.$$(".transfer-group");
  const incomingTransfers = transferGroups[0];
  const outgoingTransfers = transferGroups[1];

  if (!incomingTransfers || !outgoingTransfers) {
    throw new Error("Could not find incoming or outgoing transfers");
  }

  const incomingPlayers = await incomingTransfers.$$(".transfer-player");
  const outgoingPlayers = await outgoingTransfers.$$(".transfer-player");

  for (const incomingPlayerElement of incomingPlayers) {
    let image = await incomingPlayerElement.$eval(".avatar img", (img) =>
      img.getAttribute("src"),
    );
    while (!image || image.includes("1x1")) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      image = await incomingPlayerElement.$eval(".avatar img", (img) =>
        img.getAttribute("src"),
      );
    }
    // remove query string from image url
    image = image.split("?")[0] ?? null;
    const name = await incomingPlayerElement.$eval("h3>a", (name) =>
      name.innerHTML.trim(),
    );
    const position = await incomingPlayerElement.$eval(
      ".position",
      (position) => position.innerHTML.trim(),
    );
    const starRating = await incomingPlayerElement.$$eval(
      ".starContainer>svg",
      (stars) => {
        let numStars = 0;
        for (const star of stars) {
          if (star.children[1]?.getAttribute("fill") === "#FBD032") {
            numStars++;
          }
        }
        return numStars;
      },
    );
    let status = "";
    if ((await incomingPlayerElement.$(".status")) === null) {
      status = await incomingPlayerElement.$eval(
        ".entered-date-text",
        (status) => status.innerHTML.trim(),
      );
      // capitalize the first letter of the status
      status = status.charAt(0).toUpperCase() + status.slice(1);
    } else {
      status = await incomingPlayerElement.$eval(".status", (status) =>
        status.innerHTML.trim(),
      );
    }
    const playerPagePath = await incomingPlayerElement.$eval("h3>a", (link) =>
      link.getAttribute("href"),
    );
    const playerPage = playerPagePath?.includes("https://247sports.com/")
      ? playerPagePath
      : `https://247sports.com/${playerPagePath}`;

    let previousCollegeName = "";
    if (
      (await incomingPlayerElement.$(".transfer-prediction>a>img")) !== null
    ) {
      previousCollegeName = (await incomingPlayerElement.$eval(
        ".transfer-prediction>a>img",
        (el) => {
          return el.getAttribute("alt");
        },
      ))!;
    } else {
      // get the first image that is a child of the transfer-prediction element
      previousCollegeName = (await incomingPlayerElement.$eval(
        ".transfer-prediction img",
        (el) => {
          return el.getAttribute("alt");
        },
      ))!;
    }

    // find the college id of the previous college
    const previousCollege = await db.query.colleges.findFirst({
      where: eq(colleges.name, previousCollegeName),
    });

    const player: InsertPlayer = {
      name,
      position,
      status,
      highSchool: null,
      currentCollegeId: college.collegeId,
      newCollegeId: college.collegeId,
      previousCollegeId: previousCollege?.collegeId ?? null,
      playerId: getPlayerIdFromUrl(playerPage) ?? Bun.hash(name).toString(),
      nationalRating: null,
      playerPage,
      starRating: !Number.isNaN(starRating) ? starRating : null,
      image,
    };
    players.push(player);
  }

  for (const outgoingPlayerElement of outgoingPlayers) {
    let image = await outgoingPlayerElement.$eval(".avatar img", (img) =>
      img.getAttribute("src"),
    );
    while (!image || image.includes("1x1")) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      image = await outgoingPlayerElement.$eval(".avatar img", (img) =>
        img.getAttribute("src"),
      );
    }
    // remove query string from image url
    image = image.split("?")[0] ?? null;
    const name = await outgoingPlayerElement.$eval("h3>a", (name) =>
      name.innerHTML.trim(),
    );
    const position = await outgoingPlayerElement.$eval(
      ".position",
      (position) => position.innerHTML.trim(),
    );
    let status = "";
    if ((await outgoingPlayerElement.$(".status")) === null) {
      status = await outgoingPlayerElement.$eval(
        ".entered-date-text",
        (status) => status.innerHTML.trim(),
      );
      // capitalize the first letter of the status
      status = status.charAt(0).toUpperCase() + status.slice(1);
    } else {
      status = await outgoingPlayerElement.$eval(".status", (status) =>
        status.innerHTML.trim(),
      );
    }
    const starRating = await outgoingPlayerElement.$$eval(
      ".starContainer>svg",
      (stars) => {
        let numStars = 0;
        for (const star of stars) {
          if (star.children[1]?.getAttribute("fill") === "#FBD032") {
            numStars++;
          }
        }
        return numStars;
      },
    );
    const playerPagePath = await outgoingPlayerElement.$eval("h3>a", (link) =>
      link.getAttribute("href"),
    );
    const playerPage = playerPagePath?.includes("https://247sports.com/")
      ? playerPagePath
      : `https://247sports.com/${playerPagePath}`;

    let newCollege = null;
    if (
      (await outgoingPlayerElement.$(".transfer-prediction>ul>li>a>img")) !==
      null
    ) {
      const newCollegeName = await outgoingPlayerElement.$eval(
        ".transfer-prediction>ul>li>a>img",
        (el) => {
          return el.getAttribute("alt");
        },
      );
      if (!newCollegeName) {
        throw new Error("Could not find new college name");
      }
      console.log(newCollegeName)
      // find the college id of the previous college
      newCollege = await db.query.colleges.findFirst({
        where: eq(colleges.name, newCollegeName),
      });

      if (!newCollege) {
        throw new Error("Could not find new college");
      }
    }

    const player: InsertPlayer = {
      name,
      position,
      status,
      highSchool: null,
      currentCollegeId:
        status === "Committed" && newCollege ? newCollege.collegeId : null,
      newCollegeId: newCollege ? newCollege.collegeId : null,
      previousCollegeId: college.collegeId,
      playerId: getPlayerIdFromUrl(playerPage) ?? Bun.hash(name).toString(),
      nationalRating: null,
      playerPage,
      starRating: !Number.isNaN(starRating) ? starRating : null,
      image,
    };
    players.push(player);
  }

  return players;
}

export function getPlayerIdFromUrl(url: string | null): string | null {
  if (!url) {
    return null;
  }
  const regex = /player\/[^\/]+-(\d+)/;
  const match = url.match(regex);
  return match?.[1] ? match[1] : null;
}

export async function getRoster(
  college: College,
  browser: Browser,
): Promise<InsertPlayer[]> {
  const page = await browser.newPage();
  await page.goto(
    `https://247sports.com/college/purdue/team/purdue-boilermakers-basketball-84/roster/#bigten`,
    {
      waitUntil: "domcontentloaded",
    },
  );
  const teamBlock = await page.$(".teamtabnav_blk");

  // Get the list of team names and their corresponding URLs
  const teamList = await teamBlock!.$$eval("ul li a", (anchors) => {
    return anchors.map((a) => ({
      name: a.textContent!.trim(),
      href: a.href.trim(),
    }));
  });

  // Function to find the href corresponding to a given team name
  const findHrefByName = (
    teamList: {
      name: string;
      href: string;
    }[],
    name: string,
  ) => {
    const team = teamList.find((t) => t.name === name);
    return team ? team.href : null;
  };

  const link = findHrefByName(teamList, college.name);
  await page.goto(link!, {
    waitUntil: "domcontentloaded",
  });

  const players: InsertPlayer[] = [];

  const fullTeamName = await page.$eval(".stats-page__heading", (h1) =>
    h1.textContent!.trim(),
  );

  // take off the first five characters and the last 18 characters to get the team name
  const teamName = fullTeamName.slice(5, -18);

  if (teamName) {
    console.log("Updating team name for", college.name, "to", teamName);
    await db
      .update(colleges)
      .set({ teamName })
      .where(eq(colleges.collegeId, college.collegeId));
  } else {
    console.log("weird team name", fullTeamName);
    console.log("regex", teamName);
  }

  const playerRows = await page.$$("tbody tr");
  const numPlayers = playerRows.length / 2;
  for (let i = 0; i < numPlayers; i++) {
    // Find the two rows with the attribute data-row = i
    const playerNameRow = await page.$(
      `[data-js="name-tbody-container"] [data-row="${i}"]`,
    );
    const playerDataRow = await page.$(
      `[data-js="data-tbody-container"] [data-row="${i}"]`,
    );
    if (!playerNameRow || !playerDataRow) {
      continue;
    }
    const playerName = await playerNameRow.$eval("td", (td) =>
      td.textContent!.trim(),
    );
    // the player position is in the second td element of the player data row
    const playerPosition = await playerDataRow.$eval("td:nth-child(2)", (td) =>
      td.textContent!.trim(),
    );
    // the player high school is in the 7th td element of the player data row
    const playerHighSchool = await playerDataRow.$eval(
      "td:nth-child(7)",
      (td) => td.textContent!.trim(),
    );
    // the player star rating is the number of elements with "icon-starsolid yellow" class in the player data row
    const playerStarRating = await playerDataRow.$$eval(
      ".icon-starsolid.yellow",
      (stars) => stars.length,
    );
    // the player page is the href of the first a element in the player name row (if it exists)
    let playerPage = null;
    let playerId = null;
    if ((await playerNameRow.$("a")) !== null) {
      playerPage = await playerNameRow.$eval("a", (a) =>
        a.getAttribute("href"),
      );
      playerId = getPlayerIdFromUrl(playerPage) ?? null;
    }
    let image = null;
    if (playerPage) {
      await page.goto(playerPage, {
        waitUntil: "domcontentloaded",
      });
      try {
        const imageLink = await page.$eval(".jsonly", (img) =>
          img.getAttribute("src"),
        );
        image = imageLink?.split("?")[0];
        console.log("Got player image for", playerName, "-", image)
      } catch (error) {
        console.log("Error getting player image for", playerName);
      }
    }

    const player: InsertPlayer = {
      currentCollegeId: college.collegeId,
      highSchool: playerHighSchool != "-" ? playerHighSchool : null,
      image,
      name: playerName,
      nationalRating: null,
      newCollegeId: null,
      playerId: playerId ?? Bun.hash(playerName).toString(),
      playerPage,
      position: playerPosition,
      previousCollegeId: null,
      starRating: !Number.isNaN(playerStarRating) ? playerStarRating : null,
      status: "Signed",
    };
    players.push(player);
    if (page.url() !== link!) {
      await page.goto(link!, {
        waitUntil: "domcontentloaded",
      });
    }
  }

  return players;
}

export async function getSingleCollege(collegeName: string) {
  return await db.query.colleges.findFirst({
    where: eq(colleges.name, collegeName),
  });
}
