"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodeSchedule = require("node-schedule");
class Schedule {
    constructor(name, func, time = true, frequency = 100) {
        this.name = name;
        this.func = func;
        this.frequency = frequency;
        this.time = time;
        this.work();
    }
    work() {
        this.func.call(this);
        this.instance = this.createSchedule(typeof this.frequency);
    }
    createSchedule(type) {
        let time = this.time;
        let schedule;
        if (type === 'string') {
            schedule = nodeSchedule.scheduleJob(this.frequency, () => {
                if (typeof time === 'number' && time > 0) {
                    this.func.call(this);
                    time--;
                }
                else if (typeof time === 'boolean' && time) {
                    this.func.call(this);
                }
                else {
                    nodeSchedule.cancelJob(schedule);
                }
            });
        }
        else {
            schedule = setInterval(() => {
                if (typeof time === 'number' && time > 0) {
                    this.func.call(this);
                    time--;
                }
                else if (typeof time === 'boolean' && time) {
                    this.func.call(this);
                }
                else {
                    clearInterval(schedule);
                }
            }, this.frequency + Math.random() * 100);
        }
        return schedule;
    }
    cancelSchedule() {
        const instance = this.instance;
        if (!instance)
            return;
        if (instance instanceof nodeSchedule.Job) {
            nodeSchedule.cancelJob(instance);
        }
        else {
            clearInterval(instance);
        }
    }
}
exports.default = Schedule;
//# sourceMappingURL=Schedule.js.map