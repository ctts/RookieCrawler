import * as nodeSchedule from 'node-schedule'

interface ScheduleBase {
    name: string,
    func: Function,
    frequency?: string | number,
    time: number | boolean,
    instance: nodeSchedule.Job | NodeJS.Timeout,
    work: Function
    createSchedule: Function
}

class Schedule implements ScheduleBase {
    name: string
    func: Function
    frequency?: string | number
    time: number | boolean
    instance: nodeSchedule.Job | NodeJS.Timeout
    constructor(
        func: Function,
        time: number | boolean = true,
        frequency: string | number = 100,
    ) {
        this.func = func
        this.frequency = frequency
        this.time = time
    }
    work() {
        this.createSchedule(typeof this.frequency)
    }
    createSchedule(type: string): nodeSchedule.Job | NodeJS.Timeout {
        let time = this.time
        let schedule: nodeSchedule.Job | NodeJS.Timeout
        if (type === 'string') {
            schedule = nodeSchedule.scheduleJob(this.frequency as string, () => {
                if (typeof time === 'number' && time > 0) {
                    this.func.call(this)
                    time--
                } else if (typeof time === 'boolean' && time) {
                    this.func.call(this)
                } else {
                    nodeSchedule.cancelJob(schedule as nodeSchedule.Job)
                }
            })
        } else {
            schedule = setInterval(() => {
                if (typeof time === 'number' && time > 0) {
                    this.func.call(this)
                    time--
                } else if (typeof time === 'boolean' && time) {
                    this.func.call(this)
                } else {
                    clearInterval(schedule as NodeJS.Timeout)
                }
            }, this.frequency as number + Math.random() * 100)
        }
        return schedule
    }
    cancelSchedule() {
        const instance = this.instance
        if (!instance) return
        if (instance instanceof nodeSchedule.Job) {
            nodeSchedule.cancelJob(instance)
        } else {
            clearInterval(instance)
        }
    }
}

export default Schedule