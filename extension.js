/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const Lang = imports.lang;
const { Meta, Shell } = imports.gi;
const Main = imports.ui.main;

class Extension {

	constructor() {
		this._grabbers = new Map()
		this._connectHandle = null;
	}

	enable() {
		log("Connecting to 'accelerator-activated' event");
		this._connectHandle = global.display.connect('accelerator-activated', (display, action, deviceId, timestamp) => {
			log('Accelerator Activated: [display={}, action={}, deviceId={}, timestamp={}]', display, action, deviceId, timestamp);
			const grabber = this._grabbers.get(action);
			if (grabber) {
				grabber.callback(grabber.accelerator);
			} else {
				log('No listeners [action={}]', action);
			}
		});
		log("Connected to 'accelerator-activated' event [handle={}]", this._connectHandle);
		this._register("<super>o", (accelerator) => {
			log("Hotkey pressed: " + accelerator)
			Main.panel.statusArea.aggregateMenu.menu.toggle();
		})
	}

	disable() {
		for (const it of this._grabbers) {
			this._unregister(it[1]);
		}
		global.display.disconnect(this._connectHandle);
		log("Disconnected event handler [handle={}]", this._connectHandle);
	}

	_register(accelerator, callback) {
		log('Trying to listen for hot key [accelerator={}]', accelerator);
		const action = global.display.grab_accelerator(accelerator, 0);

		if (action == Meta.KeyBindingAction.NONE) {
			log('Unable to grab accelerator [binding={}]', accelerator);
			throw Error('Unable to grab ' + accelerator);
		} else {
			log('Grabbed accelerator [action={}]', action);
			const name = Meta.external_binding_name_for_action(action);
			log('Received binding name for action [name={}, action={}]', name, action);

			log('Requesting WM to allow binding [name={}]', name);
			Main.wm.allowKeybinding(name, Shell.ActionMode.ALL);

			this._grabbers.set(action, {
				name: name,
				accelerator: accelerator,
				callback: callback,
				action: action
			});
		}
	}

	_unregister(grabber) {
		log('Ungrabbing accelerator [action={}]', grabber.action);
		global.display.ungrab_accelerator(grabber.action);
		log('Requesting WM to disallow binding [name={}]', grabber.name);
		Main.wm.allowKeybinding(grabber.name, Shell.ActionMode.NONE);
	}
}

function init() {
	return new Extension();
}
