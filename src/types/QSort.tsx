import {QSet, qSetRef, StatementString} from "./QSet";
import {databaseRef} from "../firebase";
import firebase from "firebase";
import {Map, Record} from 'immutable'

type DocumentSnapshot = firebase.firestore.DocumentSnapshot;
type DocumentReference = firebase.firestore.DocumentReference;


export type Rank = -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4
export const rankOptions: Rank[] = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

export type PileId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const pileIds = [0, 1, 2, 3, 4, 5, 6, 7, 8];

// SortMapping - The result of a sorting
export type SortMapping = Map<PileId, StatementString[]>;

export interface SortObj {
    note: string,
    result: SortMapping,
    statementPositions: { [key: string]: number },
    qSetId: string,
    sortClass: string,
    sortedBy: string,
    sortedOn: any,
    user: string
}

// Sort - Document
// The result of one Q Sort by a user
export class qSort extends Record({
    id: undefined as unknown as string, // DB ID
    note: undefined as unknown as string, // Note about the sort
    result: undefined as unknown as SortMapping, // The result of the sort
    // sortTypeId: undefined  as unknown as string, // ID of the SortType
    qSetId: undefined as unknown as string, // ID of the SortType
    sortClass: undefined as unknown as string, // A description of the sort class
    sortedBy: undefined as unknown as string | undefined, // The sorter
    sortedOn: undefined as unknown as any, // The date of the sort
    user: undefined as unknown as DocumentReference,
}, "Sort") {

    // @ts-ignore
    qSet: QSet;
    constructor(vals: any) {
        super(vals);
        const optionalFields = ["sortedBy"] as string[];
        this.toSeq().forEach((value: any, key: string) => {
            if (optionalFields.indexOf(key) === -1 && value === undefined)
                throw Error(`${key} not defined in Sort constructor`);
            return value
        });
    }

    static async fromDocumentSnapshot(doc: DocumentSnapshot): Promise<qSort | null> {
        return new Promise(async function (resolve,reject) {

            const data = doc.data();
            if (data === undefined) return null;
            const params: { [key: string]: any } = data;
            params.id = doc.id;
            params.qSetId = data.qSet.id;
            const sort = new qSort(params);
            await databaseRef.collection("qSets").doc(sort.qSetId).get()
                .then((doc) => {
                    sort.qSet = QSet.fromDocumentSnapshot(doc)!;
                    resolve(sort);
                }).catch((r) => {
                    reject(r);
                });
        })
    }

    rankOf(statement: StatementString): Rank {
        const rank = Map(this.result).reduce((rank, statements, statementRank,) => {
            const index = statements.indexOf(statement);
            if (index === -1) {
                return rank;
            } else {
                return statementRank as Rank
            }
        }, null as null | Rank);

        if (rank == null) {
            throw(Error("Key Error"))
        }
        return rank
    }

    name(): string {
        return `${this.sortClass} by ${this.sortedBy} on ${this.sortedOn.toDate().toDateString()} using ${this.qSetId}`;
    }

    group(i: PileId): StatementString[] {
        // @ts-ignore TODO Fix this!
        const starements = this.result[i as PileId];
        if (starements === undefined) {
            throw(Error("Key Error"))
        }
        return starements
    }

    asArrays(): StatementString[][] {
        while(this.qSet === undefined){}
        const shape = this.qSet.distribution;
        return shape.reduce((arr, _, i) => [...arr, this.group(i as PileId)], [] as StatementString[][]);
    }

    asRankMap(): { [key: string]: Rank; } {
        return this.asArrays().reduce(function (obj, traits, index) {
            traits.reduce((obj, trait) => {
                obj[trait] = index - 4;
                return obj
            }, obj);
            return obj;
        }, {} as { [key: string]: number; }) as { [key: string]: Rank; };
    }
}

export function asSortMapping(x: StatementString[][]): SortMapping {
    return x.reduce(function (prev: SortMapping, current: StatementString[], i: number) {
        return prev.set(i as PileId, current);
    }, Map<PileId, StatementString[]>()) as SortMapping
}

export function asStatementPositions(qSet: QSet, result: StatementString[][]) {
    const {statements} = qSet;
    const statementPositions = {} as { [key: string]: any };
    for (let [statementCode, {statement}] of Object.entries(statements)) {
        console.log(`${statementCode}: ${statement}`);
        const m = asSortMapping(result);
        statementPositions[statementCode] = m.reduce((res, list1, i) => {
            return list1.indexOf(statement) !== -1 ? i : res;
        }, -1)
    }
    return statementPositions
}


export function listenForSortsByType(sortTypeId: string, onUpdate: (_: qSort[]) => void): () => void{
    return (databaseRef.collection("qSorts")
        .where("user", "==", firebase.auth().currentUser?.uid)
        .where("qSet", "==", qSetRef(sortTypeId))
        .onSnapshot(async function (querySnapshot) {
            var sorts: Promise<qSort|null>[] = [];
            await querySnapshot.forEach(async function (doc) {

                const sort = qSort.fromDocumentSnapshot(doc);
                sorts.push(sort)

                // const sort = await qSort.fromDocumentSnapshot(doc);
                // console.log(sort)
                // if (sort != null)
                //     sorts.push(sort);
            });
            Promise.all(sorts).then(results => {
                console.log("Ended");
                onUpdate(results.filter(s => s!== null) as qSort[])
            })
        }));
}

export function getSort(id: string, storeFunction: (_: qSort | null) => void):void {
    databaseRef.collection("qSorts").doc(id).get().then(async (doc) => {
        if (doc.exists) {
            storeFunction(await qSort.fromDocumentSnapshot(doc));
        } else {
            storeFunction(null);
        }
    }).catch(function (error) {
        console.log("Error getting document:", error);
    });
}

export function pushSort(sort: SortObj, onComplete: (_: qSort) => void) {
    // Add a new document with a generated id.
    const sortParams = sort as { [key: string]: any };
    sortParams["qSet"] = qSetRef(sort["qSetId"]);
    sortParams["result"] = sort.result.toJS();
    databaseRef.collection("qSorts").add(sortParams)
        .then((ref) => ref.get()
            .then(async function (doc) {
                const sortRecord = await qSort.fromDocumentSnapshot(doc);
                if (sortRecord === null) throw Error("Sort not created, but without error. This is a real problem");
                onComplete(sortRecord);
            })
            .catch(function (error) {
                console.error("Error adding document: ", error);
            }));
}