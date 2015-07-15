# Screeps AI

My current strategy for Screeps. Progress is slow.

I plan on eventually integrating my [Screeps TypeScript library](https://github.com/vyder/screeps_ts-defs) here, so my main.js isn't such a mess.

## Install / Usage:

0. Prerequisites: `npm install -g grunt grunt-screeps`
1. Copy `Gruntfile.js.sample` to `Gruntfile.js`
2. Update `Gruntfile.js` with your Email and Password
3. Execute `grunt` in the root directory, to upload all the files in your `src/` directory

## Getting Started

I didn't do a whole lot of research before randomly choosing a starting room, and getting down to
coding. So here are some pro tips of the regrets I have picking my room:

1. Pick a room with as little Swampy terrain (snot green colored ground) as possible. This slows down
   movement by a LOT. I can't wait to build roads and overcome the crazy delay in harvesting.
2. Pick a room with a Room Controller that is fairly close to an Energy Source, and also not next to
   any Source Keepers (enemy AI, red in color).
3. Place your first Spawn point optimizing for closeness to the Room's Controller, and the nearest
   energy Source.
4. If you accidentally kill all your Creeps, and don't have the energy to spawn new Creeps, click on
   your Spawn, and click the 'Reinforcement' button in the right sidebar. You can use this once every
   1000 game ticks.
5. ...