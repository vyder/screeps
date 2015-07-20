/**
 * Main.js - Version 0.2.0
 * @author Vidur Murali <vidur@monkeychai.com>
 *
 * This iteration of Main.js executes the following jobs in order:
 * 1. Creates Harvesters
 * 2. Creates a Miner
 * 2. Creates Mules
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
if( homeController ) {
    if( Memory.controllerState && Memory.controllerState.level && ( homeController.level > Memory.controllerState.level) ) {
        Game.notify("Controller was upgraded to Level " + homeController.level + "!");
        Memory.controllerState.level = homeController.level;
    } else {
        Memory.controllerState = {
            'level': homeController.level
        };
    }
} else {
    Memory.controllerState = {
        'level': 1
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
 * Miners simply harvest energy from a Source and drop the
 * harvested energy on the ground for Mules to pickup
 *
 * This division of labor makes the energy harvest production
 * line much smoother.
 */
var MINER     = 'Miner';

/**
 * Mules find the nearest source of dropped energy, pick it
 * up and drop it off at their assigned drop off point.
 */
var MULE      = 'Mule';

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
    //'Harvester1': {
    //    'role': HARVESTER,
    //    'body': [CARRY, CARRY, WORK, MOVE, MOVE],
    //    'keepSpawning': false
    //},
    //'Harvester2': {
    //    'role': HARVESTER,
    //    'body': [CARRY, CARRY, WORK, MOVE, MOVE],
    //    'keepSpawning': false
    //},
    'Miner1': {
        'role': MINER,
        'body': [WORK, WORK, MOVE, MOVE],
        'keepSpawning': true,
        'memory': {
            'sourceID': '5540ec830f7b59f664370102'
        }
    },
    'Miner2': {
        'role': MINER,
        'body': [WORK, WORK, MOVE, MOVE],
        'keepSpawning': true,
        'memory': {
            'sourceID': '5540ec830f7b59f664370103'
        }
    },
    // 'Miner3': {
    //     'role': MINER,
    //     'body': [WORK, WORK, MOVE, MOVE],
    //     'keepSpawning': true,
    //     'memory': {
    //         'sourceID': ''
    //     }
    // },
    'Mule1': {
        'role': MULE,
        'body': [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
        'keepSpawning': true,
        'memory': {
            'pickupID': Game.flags.mulePickup1.id,
            'dropID': homeSpawn.id
        }
    },
    'Mule2': {
        'role': MULE,
        'body': [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
        'keepSpawning': true,
        'memory': {
            'pickupID': Game.flags.mulePickup1.id,
            'dropID': homeSpawn.id
        }
    },
    // 'Mule3': {
    //     'role': MULE,
    //     'body': [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
    //     'keepSpawning': true,
    //     'memory': {
    //         'pickupID': Game.flags.mulePickup1.id,
    //         'dropID': Game.flags.muleDrop.id
    //     }
    // },
    // 'Mule4': {
    //     'role': MULE,
    //     'body': [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
    //     'keepSpawning': true,
    //     'memory': {
    //         'pickupID': Game.flags.mulePickup2.id,
    //         'dropID': Game.flags.muleDrop.id
    //     }
    // },
    // 'Mule5': {
    //     'role': MULE,
    //     'body': [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
    //     'keepSpawning': true,
    //     'memory': {
    //         'pickupID': Game.flags.mulePickup2.id,
    //         'dropID': Game.flags.builderRefuel.id
    //     }
    // },
    // 'Mule6': {
    //     'role': MULE,
    //     'body': [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
    //     'keepSpawning': true,
    //     'memory': {
    //         'pickupID': Game.flags.mulePickup1.id,
    //         'dropID': Game.flags.builderRefuel.id
    //     }
    // },
    // 'Builder1': {
    //     'role': BUILDER,
    //     'body': [WORK, CARRY, CARRY, CARRY, MOVE],
    //     'keepSpawning': true
    // },
    // 'Builder2': {
    //     'role': BUILDER,
    //     'body': [WORK, CARRY, CARRY, CARRY, MOVE],
    //     'keepSpawning': true
    // },
    // 'Priest1': {
    //     'role': PRIEST,
    //     'body': [CARRY, CARRY, WORK, MOVE, MOVE],
    //     'keepSpawning': true
    // },
    // 'Priest2': {
    //     'role': PRIEST,
    //     'body': [CARRY, CARRY, WORK, MOVE, MOVE],
    //     'keepSpawning': true
    // },
    // 'Priest3': {
    //     'role': PRIEST,
    //     'body': [CARRY, CARRY, WORK, MOVE, MOVE],
    //     'keepSpawning': true
    // },
    // 'Priest4': {
    //     'role': PRIEST,
    //     'body': [CARRY, CARRY, WORK, MOVE, MOVE],
    //     'keepSpawning': true
    // }
};

// pauseConstruction override in Memory
//var pauseConstruction = false || Memory.pauseConstruction;

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

                var memory = { 'role': data.role };
                if( data.memory ) {
                    _.extend(memory, data.memory);
                }
                homeSpawn.createCreep(data['body'], name, memory);
            } else {
                console.log("ERROR: Cannot create " + name + ".");

                if (response === ERR_BUSY) {
                    console.log("ERROR: Spawn is busy.");
                } else if (response === ERR_NOT_ENOUGH_ENERGY) {
                    //pauseConstruction = true;
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
    //return creep.name + ":" + creep.memory.role;
    return creep.name;
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
// var reassignRole = HARVESTER;
// if( homeSpawn.energy === homeSpawn.energyCapacity ) {
//     reassignRole = PRIEST;
// }
// if( workers['Harvester1'] ) {
//     workers['Harvester1'].memory.role = reassignRole;
// }
// if( workers['Harvester2'] ) {
//     workers['Harvester2'].memory.role = reassignRole;
// }

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

    } else if( worker_role === MINER ) {
        // Miner's job

        if( worker.memory.sourceID ) {
            var source = Game.getObjectById(worker.memory.sourceID);
            if( source ) {
                if( worker.pos.isNearTo(source) ) {
                    worker.harvest(source);
                    console.log(creepNameAndTitle(worker) + " is happily mining away.");
                } else {
                    worker.moveTo(source);
                    console.log(creepNameAndTitle(worker) + " is heading to the Source.");
                }
            } else {
                console.log(creepNameAndTitle(worker) + " seems to have a corrupted memory?");
            }
        } else {
            var source = nearestSourceTo(homeSpawn.pos);
            worker.memory.sourceID = source.id;
            console.log(creepNameAndTitle(worker) + " is looking for the nearest Source");
        }
    } else if( worker_role === MULE ) {
        // Mule's job

        if( worker.energy < worker.energyCapacity ) {
            var pickup = Game.getObjectById(worker.memory.pickupID);
            if( pickup ) {
                if (worker.pos.isNearTo(pickup)) {
                    var searchRadius = 1;
                    var searchArea = {
                        top:    pickup.pos.y - searchRadius,
                        left:   pickup.pos.x - searchRadius,
                        bottom: pickup.pos.y + searchRadius,
                        right:  pickup.pos.x + searchRadius
                    };
                    var resultArea = worker.room.lookForAtArea('energy', searchArea.top, searchArea.left, searchArea.bottom, searchArea.right);
                    var energySources = [];
                    _.each(resultArea, function(row) {
                        _.each(row, function(cell) {
                            if( cell && cell.energy ) {
                                energySources.push(worker.room.lookForAt('energy', cell.pos.x, cell.pos.y));
                            }
                        });
                    });

                    var energySource = _.sample(energySources);

                    if( energySource ) {
                        worker.pickup(energySource);
                        console.log(creepNameAndTitle(worker) + " is picking up some Energy.");
                    } else {
                        console.log(creepNameAndTitle(worker) + " is waiting for some Energy to fall from the skies.");
                    }
                } else {
                    worker.moveTo(pickup);
                    console.log(creepNameAndTitle(worker) + " is heading over to the pickup point.");
                }
            } else {
                console.log(creepNameAndTitle(worker) + " can't remember where to pick up Energy.");
            }
        } else {
            var dropOff = Game.getObjectById(worker.memory.dropID);
            if( dropOff ) {
                if( worker.pos.isNearTo(dropOff) ) {
                    if( dropOff.structureType === 'spawn' ) {
                        // TODO: Track state so that Mule waits and completely drops all energy
                        worker.transferEnergy(dropOff);
                        console.log(creepNameAndTitle(worker) + " is transferring Energy to Spawn.");
                    } else {
                        worker.dropEnergy();
                        console.log(creepNameAndTitle(worker) + " is unceremoniously dropping its Energy load.");
                    }
                } else {
                    worker.moveTo(dropOff);
                    console.log(creepNameAndTitle(worker) + " is plodding over to the drop off point.");
                }
            } else {
                console.log(creepNameAndTitle(worker) + " can't remember where to drop off the Energy.");
            }
        }
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
                var energyLocation = Game.flags.builderRefuel;
                var searchRadius = 1;
                var searchArea = {
                    top:    energyLocation.pos.y - searchRadius,
                    left:   energyLocation.pos.x - searchRadius,
                    bottom: energyLocation.pos.y + searchRadius,
                    right:  energyLocation.pos.x + searchRadius
                };
                var resultArea = worker.room.lookForAtArea('energy', searchArea.top, searchArea.left, searchArea.bottom, searchArea.right);
                Memory.investigateArea = resultArea;
                var energySources = [];
                _.each(resultArea, function(row) {
                    _.each(row, function(cell) {
                        if( cell && cell.energy ) {
                            energySources.push(worker.room.lookForAt('energy', cell.pos.x, cell.pos.y));
                        }
                    });
                });

                var energySource = _.sample(energySources);

                if( Memory.pauseConstruction ) {
                    // Pause Construction while Spawn is busy creating Creeps
                    console.log(creepNameAndTitle(worker) + " has paused construction temporarily.");
                } else {
                    if( energySource ) {
                        if (worker.pos.isNearTo(energySource)) {
                            worker.pickup(energySource);
                            console.log(creepNameAndTitle(worker) + " is refueling.");
                        } else {
                            worker.moveTo(energySource);
                            console.log(creepNameAndTitle(worker) + " is heading over to refuel.");
                        }
                    } else {
                        worker.moveTo(energySource);
                        console.log(creepNameAndTitle(worker) + " can't find any fuel at the refuel station!");
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

        var energyLocation = Game.flags.muleDrop;
        var searchRadius = 1;
        var searchArea = {
            top:    energyLocation.pos.y - searchRadius,
            left:   energyLocation.pos.x - searchRadius,
            bottom: energyLocation.pos.y + searchRadius,
            right:  energyLocation.pos.x + searchRadius
        };
        var resultArea = worker.room.lookForAtArea('energy', searchArea.top, searchArea.left, searchArea.bottom, searchArea.right);
        Memory.investigateArea = resultArea;
        var energySources = [];
        _.each(resultArea, function(row) {
            _.each(row, function(cell) {
                if( cell && cell.energy ) {
                    energySources.push(worker.room.lookForAt('energy', cell.pos.x, cell.pos.y));
                }
            });
        });

        var energySource = _.sample(energySources);

        if( homeController ) {
            if( energySource ) {
                if (worker.energy === 0) {
                    if (worker.pos.isNearTo(energySource)) {
                        worker.pickup(energySource);
                        console.log(creepNameAndTitle(worker) + " is collecting Energy for the Almighty Controller.");
                    } else {
                        worker.moveTo(energySource);
                        console.log(creepNameAndTitle(worker) + " is searching for Energy for the Almighty Controller.");
                    }
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
                worker.moveTo(energyLocation);
                console.log(creepNameAndTitle(worker) + " couldn't find any dropped Energy to pickup.");
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