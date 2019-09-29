import {of as observableOf} from 'rxjs';
import {delay} from 'rxjs/operators';

import hot from '../../util/hot';

// Simulated external data source
export default function fetchW() {
    return hot(observableOf(8).pipe(delay(50)));
}
