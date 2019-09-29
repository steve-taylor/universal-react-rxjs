import {of as observableOf} from 'rxjs';
import {delay} from 'rxjs/operators';

import hot from '../../util/hot';

// Simulated external data source
export default function fetchV() {
    return hot(observableOf(3).pipe(delay(50)));
}
