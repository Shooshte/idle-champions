import type { Hero, Seat } from "../types/heroes";

const USER_ID = 99543;
const USER_HASH = "8843f90c49fe1d028ecd93c3a6f610f4";

// https://ps22.idlechampions.com/~idledragons/post.php?call=getuserdetails&instance_key=1&mobile_client_version=547&user_id=99543&hash=8843f90c49fe1d028ecd93c3a6f610f4
// https://ps22.idlechampions.com/~idledragons/post.php?call=getcampaigndetails&game_instance_id=1&instance_id=1&mobile_client_version=547&user_id=99543&hash=8843f90c49fe1d028ecd93c3a6f610f4
// https://ps22.idlechampions.com/~idledragons/post.php?call=getallformationsaves&user_id=99543&hash=8843f90c49fe1d028ecd93c3a6f610f4&instance_id=1391829696&mobile_client_version=547
// https://ps21.idlechampions.com/~idledragons/post.php?call=getDefinitions

const getDefinitions = async () => {
  const res = await fetch(
    "https://ps21.idlechampions.com/~idledragons/post.php?call=getDefinitions"
  );

  if (!res.ok) {
    throw new Error("Failed to fetch user details!");
  }

  return res.json();
};

const getUserDetails = async () => {
  const res = await fetch(
    `https://ps21.idlechampions.com/~idledragons/post.php?call=getuserdetails&instance_key=1&mobile_client_version=549&user_id=${USER_ID}&hash=${USER_HASH}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch user details!");
  }

  return res.json();
};

export const getHeroes = async (): Promise<Hero[]> => {
  const definitions = await getDefinitions();
  const userDetails = await getUserDetails();

  const gameInstances = userDetails.details.game_instances.map(
    // @ts-ignore
    (formationData) => {
      return {
        customName: formationData.custom_name,
        formation: formationData.formation,
        gameInstanceID: formationData.game_instance_id,
      };
    }
  );

  const parsedHeroes = definitions.hero_defines
    // @ts-ignore
    .filter((hero) => hero.is_available)
    // @ts-ignore
    .map((heroData) => {
      // @ts-ignore
      const userHero = userDetails.details.heroes.find((hero) => {
        return parseInt(hero.hero_id) === heroData.id;
      });

      // @ts-ignore
      const game_instance = gameInstances.find((instance) =>
        // @ts-ignore
        instance.formation.some((heroId) => heroId === heroData.id)
      );

      return {
        id: heroData.id,
        name: heroData.name,
        seat_id: heroData.seat_id,
        game_instance_id: game_instance?.gameInstanceID,
        graphic_id: heroData.graphic_id,
        portrait_graphic_id: heroData.portrait_graphic_id,
        character_sheet_details: {
          full_name: heroData.character_sheet_details.full_name,
          class: heroData.character_sheet_details.class,
          race: heroData.character_sheet_details.race,
          age: heroData.character_sheet_details.age,
          alignment: heroData.character_sheet_details.alignment,
          ability_scores: heroData.character_sheet_details.ability_scores,
        },
        owned: userHero !== undefined,
        tags: heroData.tags,
      };
    });

  return parsedHeroes;
};

export const parseSeats = (heroesData: Hero[]): Seat[] => {
  const seats = heroesData.reduce((acc: Seat[], currentHero) => {
    const seatDataExists = acc.some((seat) => seat.id === currentHero.seat_id);
    if (seatDataExists) {
      return acc.map((seat) => {
        if (seat.id === currentHero.seat_id) {
          return {
            id: seat.id,
            heroes: [...seat.heroes, currentHero],
          };
        }
        return {
          ...seat,
        };
      });
    }

    const newSeatData = {
      id: currentHero.seat_id,
      heroes: [currentHero],
    };

    acc.splice(currentHero.seat_id - 1, 0, newSeatData);
    return acc;
  }, []);

  return seats;
};
