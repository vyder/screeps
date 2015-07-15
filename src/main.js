/**
 * Main.js - Version 0.1.0
 * @author Vidur Murali <vidur@monkeychai.com>
 *
 * This iteration of Main.js executes the following jobs in order:
 * 1. Creates Harvesters
 * 2. Creates Priests
 * 3. Upgrades Controller
 * 4. Sends a notification to Account when Controller is upgraded
 *
 * Construction is manual. Setup some construction projects, and
 * enable Builder spawning manually when you get the notification.
 *
 * This script also takes care of respawning Creeps when they die.
 */

var _ = require('lodash');

var homeSpawn = Game.spawns.HQ;

// Find our home room controller
var homeController;
if( !Memory.homeControllerID ) {
    homeController = homeSpawn.room.controller;
    Memory.homeControllerID = homeController.id;
} else {
    homeController = Game.getObjectById(Memory.homeControllerID);
}

// Get notified every time the Controller is upgraded
if( Memory.controllerState && Memory.controllerState.level && (homeController.level > Memory.controllerState.level) ) {
    Game.notify("Controller was upgraded to Level " + homeController.level + "!");
    Memory.controllerState.level = homeController.level;
} else {
    Memory.controllerState = {
        'level': homeController.level
    };
}

// Print info about Game State
console.log("Game State:");

// Spawn
console.log("[Spawn]");
console.log("Health: " + homeSpawn.hits + "/" + homeSpawn.hitsMax);
console.log("Energy: " + homeSpawn.energy + "/" + homeSpawn.energyCapacity);

// Controller
if( homeController ) {
    console.log("[Controller]");
    console.log("Level: " + homeController.level);
    console.log("Progress: " + homeController.progress + "/" + homeController.progressTotal);
}

console.log("---");

// Find nearest source to homeSpawn
// @param {RoomPosition} target
var nearestSourceTo = function(target) {
    var potentialSources = homeSpawn.room.find(FIND_SOURCES_ACTIVE);
    return _.min(potentialSources, function(source) {
        return target.getRangeTo(source);
    });
};

// Roles

/**
 * Harvesters are responsible for keeping their Spawn
 * and its Extensions replenished with Energy
 */
var HARVESTER = 'Harvester';

/**
 * Builders are tasked with building new Structures
 * as and when they find the next closest one.
 *
 * They will refuel from the nearest Energy Source/Spawn
 * to that ConstructionSite
 */
var BUILDER   = 'Builder';

/**
 * The Priests are tasked with worshiping the Controller
 * (upgrading) for all eternity.
 *
 * Praise the Mighty Controller!
 */
var PRIEST    = 'Priest';


// Part Costs Reference:
// MOVE   = 50
// WORK   = 100
// CARRY  = 50
// ATTACK = 80
// HEAL   = 200
// TOUGH  = 10
// RANGED_ATTACK = 150

var workers = Game.creeps;

// Resurrect any dead creeps
// TODO: Refactor registry to worker queues
var worker_registry = {
    'Harvester1': {
        'role': HARVESTER,
        'body': [CARRY, CARRY, WORK, MOVE, MOVE],
        'keepSpawning': true
    },
    'Harvester2': {
        'role': HARVESTER,
        'body': [CARRY, CARRY, WORK, MOVE, MOVE],
        'keepSpawning': true
    },
    'Builder1': {
        'role': BUILDER,
        'body': [WORK, CARRY, CARRY, CARRY, MOVE],
        'keepSpawning': false
    },
    'Builder2': {
        'role': BUILDER,
        'body': [WORK, CARRY, CARRY, CARRY, MOVE],
        'keepSpawning': false
    },
    'Priest1': {
        'role': PRIEST,
        'body': [CARRY, CARRY, WORK, MOVE, MOVE],
        'keepSpawning': true
    },
    'Priest2': {
        'role': PRIEST,
        'body': [CARRY, CARRY, WORK, MOVE, MOVE],
        'keepSpawning': true
    },
    'Priest3': {
        'role': PRIEST,
        'body': [CARRY, CARRY, WORK, MOVE, MOVE],
        'keepSpawning': true
    }
};

// pauseConstruction override in Memory
var pauseConstruction = false || Memory.pauseConstruction;

console.log("Life Check: ");
_.forEach(worker_registry, function(data, name) {
    var worker = workers[name];
    if( worker ) {
        if( worker.ticksToLive <= 10 ) {
            console.log(name + ' will die soon.');
        } else if( worker.ticksToLive <= 2 ) {
            console.log(name + ', the Grim Reaper is here for you now...');
        } else {
            console.log(name + ' alive and kicking.');
        }
    } else {
        console.log(name + ' is dead...');

        if( data.keepSpawning ) {
            var response = homeSpawn.canCreateCreep(data['body'], name);
            if (response === OK) {
                console.log("Resurrecting " + name + ".");
                homeSpawn.createCreep(data['body'], name, { 'role': data.role });
            } else {
                console.log("ERROR: Cannot create " + name + ".");

                if (response === ERR_BUSY) {
                    console.log("ERROR: Spawn is busy.");
                } else if (response === ERR_NOT_ENOUGH_ENERGY) {
                    pauseConstruction = true;
                    console.log("ERROR: Spawn does not have enough energy.");
                } else if (response === ERR_INVALID_ARGS) {
                    console.log("ERROR: Spawn received invalid arguments to create!");
                }
            }
        } else {
            console.log(name + ' will not be respawned by design.');
        }
    }
});
console.log("---");

var creepNameAndTitle = function(creep) {
    return creep.name + ":" + creep.memory.role;
};

/**
 * Role Re-assign
 *
 * At the early stage, it's a pain in the ass to upgrade the Controller, especially
 * in the Room I'm in right now (the Controller is way on the far side of the Room).
 *
 * This little snippet reassigns the Harvesters to pray if homeSpawn is at max energy.
 *
 * They will go back to Harvesting if homeSpawn spawns a Creep and its energy level
 * drops.
 */
var reassignRole = HARVESTER;
if( homeSpawn.energy === homeSpawn.energyCapacity ) {
    reassignRole = PRIEST;
}
workers['Harvester1'].memory.role = reassignRole;
workers['Harvester2'].memory.role = reassignRole;

/**
 * Put the Creeps to work
 */

console.log("Work Check:");
_.each(workers, function(worker) {

    if( worker.spawning ) {
        console.log(creepNameAndTitle(worker) + " is spawning...");
        return;
    }

    var worker_role = worker.memory.role;

    if( worker_role === HARVESTER ) {
        // Harvester's job

        if( worker.energy < worker.energyCapacity ) {
            var source = nearestSourceTo(homeSpawn.pos);

            worker.moveTo(source);
            worker.harvest(source);
        } else {
            worker.moveTo(homeSpawn);
            worker.transferEnergy(homeSpawn);
        }
        console.log(creepNameAndTitle(worker) + " is slaving away.");

    } else if( worker_role === BUILDER ) {
        // Builder's job

        /**
         * ConstructionSites are manually created in the Room.
         * The Builders then just work on whatever sites are
         * closest to them, sourcing fuel from the closest
         * energy source/structure to their worksite
         *
         * TODO: Set ConstructionSite priority
         */

        var worksite;

        // Check if the worksite in memory is still under construction
        if( worker.memory.worksiteID ) {
            var potentialWorksite = Game.getObjectById(worker.memory.worksiteID);
            if( potentialWorksite ) {
                if( potentialWorksite.progress < potentialWorksite.progressTotal ) {
                    worksite = potentialWorksite;
                } else {
                    potentialWorksite.remove();
                    delete(worker.memory.worksiteID);
                    delete(worker.memory.refuelsiteID);
                }
            }
        }

        // Look for new construction sites
        if( !worksite ) {
            // Find nearest worksite to this Creep
            var potentialWorksite = worker.pos.findClosest(FIND_CONSTRUCTION_SITES);
            if( potentialWorksite ) {
                worksite = potentialWorksite;
                worker.memory.worksiteID = worksite.id;
            }
        }

        if( worksite ) {
            if( worker.energy === 0 ) {
                if( pauseConstruction ) {
                    // Pause Construction while Spawn is busy creating Creeps
                    console.log(creepNameAndTitle(worker) + " has paused construction temporarily.");
                } else {
                    // Locate nearest fueling station if one isn't in memory already
                    // TODO: Implement this. (Using homeSpawn for now)
                    worker.moveTo(homeSpawn);
                    if (homeSpawn.energy < worker.energyCapacity) {
                        console.log(creepNameAndTitle(worker) + " is waiting for homeSpawn to recharge itself.");
                    } else {
                        homeSpawn.transferEnergy(worker, worker.energyCapacity);
                        console.log(creepNameAndTitle(worker) + " is refueling at homeSpawn.");
                    }
                }
            } else {
                // Keep building
                worker.moveTo(worksite);
                worker.build(worksite);
                console.log(creepNameAndTitle(worker) + " is building at ConstructionSite ID: " + worksite.id + ".");
            }
        } else {
            // Didn't find any work to do
            console.log(creepNameAndTitle(worker) + " is awaiting further instructions.");
        }

    } else if( worker_role === PRIEST ) {
        // Priest's job

        if( homeController ) {
            if (worker.energy < worker.energyCapacity) {
                var source = nearestSourceTo(homeController.pos);

                worker.moveTo(source);
                worker.harvest(source);
                console.log(creepNameAndTitle(worker) + " is collecting Energy for the Almighty Controller.");
            } else {
                if (worker.pos.isNearTo(homeController)) {
                    console.log(creepNameAndTitle(worker) + " is praying at the Altar of the Controller.");
                    worker.upgradeController(homeController);
                } else {
                    console.log(creepNameAndTitle(worker) + " is heading towards the Controller.");
                    worker.moveTo(homeController);
                }

            }
        } else {
            console.log(creepNameAndTitle(worker) + " couldn't find a Controller to worship.");
        }
    } else {}

});

console.log("End of Tick.");
console.log("------------");

// Construction Projects TODO:
// 1. Extension x1
// 2. Ramparts - South gate
// 3. Walls - South gate
// 4. Extension x1
// 5. Ramparts - East gate
// 6. Walls - East gate