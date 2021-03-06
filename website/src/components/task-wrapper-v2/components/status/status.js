import React, { Component } from 'react';
import style from '../../base-styling.module.scss';
import styles from './status.module.scss';
import cx from 'classnames';
import { Grid, Row, Col, FormGroup, FormControl, Button, OverlayTrigger, Popover } from 'react-bootstrap';
import Assignees from '../assignees-equipment/assignees/assignees';
import $ from 'jquery';
import { findDOMNode } from 'react-dom';
import { FieldGroup } from '../../../fields';
import SignatureCanvas from 'react-signature-canvas';
import SavingSpinner from '../../../saving-spinner/saving-spinner';
import { getStatusDetails } from '../../../../helpers/status_dict_lookup';
import TaskItemsContainer from '../../../task-items-container/task-items-container';
import CrewSelectorV2 from '../../../crew-selector/crew-selector';
import moment from 'moment-timezone';

export default class Status extends Component {
  constructor(props) {
    super(props);

    this.handleButtonClick = this.handleButtonClick.bind(this);
    this.changeNote = this.changeNote.bind(this);
    this.closeOverlay = this.closeOverlay.bind(this);
    this.onEnteredOverlay = this.onEnteredOverlay.bind(this);
    this.closeItemsContainer = this.closeItemsContainer.bind(this);
    this.openItemsModal = this.openItemsModal.bind(this);
    this.saveItemsStatus = this.saveItemsStatus.bind(this);
    this.selectReason = this.selectReason.bind(this);
    this.showRequirementPopup = this.showRequirementPopup.bind(this);
    this.changeEstimate = this.changeEstimate.bind(this);
    this.changeAddress = this.changeAddress.bind(this);
    this.saveStatus = this.saveStatus.bind(this);
    this.checkTaskEndDatePassed = this.checkTaskEndDatePassed.bind(this);
    this.changeConfirmationStatus = this.changeConfirmationStatus.bind(this);
    this.changeState = this.changeState.bind(this);

    this.state = {
      current_status: null,
      current_overlay_id: null,
      notes: '',
      showItemsContainer: false,
      orderStatus: null,
      exception: null,
      estimate: 0,
      address: null,
      savingStatus: false,
      confirmed: false
    };
  }

  saveStatus(idx, status) {
    this.setState({
      savingStatus: true
    });
    const exception = this.state.exception;
    const notes = this.state.notes;
    let customer_signature = null;
    if (exception) {
      exception['notes'] = this.state.notes;
    }
    let address = this.state.address;
    if (!address && (this.props.primaryAddress || this.props.additionalAddresses) && status.type.toUpperCase() === 'ENROUTE') {
      address = this.props.primaryAddress || this.props.additionalAddresses[0];
    }
    if (status.require_signature) {
      let base64string = this.signCanvas.toDataURL('image/jpeg');
      let arr = base64string.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const file = new File([u8arr], 'signature' + Math.random() + '.jpeg', { type: mime });
      this.props.uploadFilesOnServer(file).then((res) => {
        customer_signature = {
          file_id: res[0].file_id,
          file_path: res[0].file_path,
          filename: res[0].filename
        };

        if (exception) {
          const files = [];
          files.push($.extend(true, {}, customer_signature));
          exception['files'] = files;
          customer_signature = null;
        }

        this.props.sendTaskStatus(status.type, status.title, status.id, notes, Number(this.state.estimate), status.visible_to_customer, status.color, status.custom_message_template, address ? JSON.stringify(address) : null, null, exception ? JSON.stringify(exception) : null, customer_signature);
        this.setState({
          notes: '',
          exception: null,
          estimate: 0,
          address: null,
          savingStatus: false,
          confirmed: false,
          current_status: null

        });
        this.refs['popup-' + idx].hide();
      });
    } else {
      this.props.sendTaskStatus(status.type, status.title, status.id, notes, Number(this.state.estimate), status.visible_to_customer, status.color, status.custom_message_template, address ? JSON.stringify(address) : null, null, exception ? JSON.stringify(exception) : null, customer_signature);
      this.setState({
        notes: '',
        exception: null,
        estimate: 0,
        address: null,
        savingStatus: false,
        confirmed: false,
        current_status: null
      });
      this.refs['popup-' + idx].hide();
    }
  }

  changeState() {
    this.setState({
      confirmed: false,
    });
  }

  changeConfirmationStatus(idx, status, mark_status = false) {
    this.setState({
      confirmed: true,
    });
    if (mark_status) {
      this.saveStatus(idx, status);
    }
  }

  closeItemsContainer() {
    this.setState({
      showItemsContainer: false,
    });
  }

  openItemsModal(idx, status) {
    this.setState({
      endDateCheck: true,
      orderStatus: status,
      showItemsContainer: true,
    });
  }

  checkTaskEndDatePassed(task) {
    let unscheduled = task.unscheduled;
    if (unscheduled) {
      return false;
    } else if (!task.end_datetime) {
      return false;
    }
    let dateNow = moment.utc().format('YYYY-MM-DD');
    let taskEndDate = moment(task.end_datetime).format('YYYY-MM-DD');

    if (dateNow <= taskEndDate) {
      return false;
    }
    return true;
  }

  changeAddress(e) {
    if (e.target.value === 'primary') {
      this.setState({
        address: this.props.primaryAddress,
      });
    } else {
      this.setState({
        address: this.props.additionalAddresses[Number(e.target.value)],
      });
    }
  }

  selectReason(e) {
    if (e.target.value !== null) {
      const selected_exception = this.props.companyProfile && this.props.companyProfile.exceptions && this.props.companyProfile.exceptions.find((exception) => {
        return exception.reason_code === Number(e.target.value);
      });
      const exception = {
        reason_code: selected_exception.reason_code,
        reason_title: selected_exception.notes,
        files: []
      };
      this.setState({
        exception
      });
    } else {
      return false;
    }
  }

  closeItemsContainer() {
    this.setState({
      showItemsContainer: false
    });
  }

  openItemsModal(idx, status) {
    this.setState({
      orderStatus: status,
      showItemsContainer: true
    });
  }

  saveItemsStatus(items) {
    const orderStatus = $.extend(true, {}, this.state.orderStatus);
    this.props.sendTaskStatus(orderStatus.type, orderStatus.title, orderStatus.id, null, null, orderStatus.visible_to_customer, orderStatus.color, orderStatus.custom_message_template, null, JSON.stringify(items));
    this.closeItemsContainer();
  }

  handleButtonClick(id, type, title, status, endDatePassed, visibleToCustomer, color, custom_message_template) {
    const statusObject = status;
    if (this.state.current_status !== null && title !== this.state.current_status) {
      this.setState({
        current_status: title,
        confirmed: false
      });
    } else if (endDatePassed) {
      this.setState({
        current_status: title
      });
    } else if (statusObject.require_signature || statusObject.require_estimate || statusObject.require_notes ||
      (statusObject.type === 'ENROUTE' && ((this.props.primaryAddress && this.props.additionalAddresses && this.props.additionalAddresses.length > 0) || ((this.props.additionalAddresses && this.props.additionalAddresses.length > 1)))) ||
      (statusObject.require_reason && this.props.companyProfile && this.props.companyProfile.exceptions && this.props.companyProfile.exceptions.length > 0)) {
      this.setState({
        current_status: title
      });
    } else {
      this.props.sendTaskStatus(type, title, id, null, null, visibleToCustomer, color, custom_message_template, this.props.primaryAddress && JSON.stringify(this.props.primaryAddress) || (this.props.additionalAddresses && JSON.stringify(this.props.additionalAddresses[0])) || null);
      this.setState({
        current_status: null,
        confirmed: false
      });
    }
  }

  closeOverlay(idx) {
    this.setState({
      confirmed: false,
      current_status: null
    });
    this.refs['popup-' + idx].hide();
  }

  changeNote(e) {
    this.setState({
      notes: e.target.value
    });
  }

  changeEstimate(e, value = '') {
    let estimate = value;
    if (!estimate) {
      estimate = e.target.value;
    }
    if (!isNaN(estimate)) {
      this.setState({
        estimate: estimate.replace(/\s+/g, '')
      });
    }
  }

  onEnteredOverlay(idx) {
    const inputGroupDomNode = findDOMNode(this.inputArea);

    if (inputGroupDomNode) {
      inputGroupDomNode.focus();
    }

    this.setState({
      current_overlay_id: idx,
      confirmed: false,
    });
  }

  showRequirementPopup(idx, status, endDatePassed) {
    const showAddressPopup = status.type.toUpperCase() === 'ENROUTE' && ((this.props.primaryAddress && this.props.additionalAddresses && this.props.additionalAddresses.length > 0) || ((this.props.additionalAddresses && this.props.additionalAddresses.length > 1))) ? true : false;
    const showExceptionPopup = status.require_reason && this.props.companyProfile && this.props.companyProfile.exceptions && this.props.companyProfile.exceptions.length > 0 ? true : false;
    const showNotesPopup = status.require_notes ? true : false;
    const showEstimatePopup = status.require_estimate ? true : false;
    const showSignaturePopup = status.require_signature ? true : false;

    let fullWidth = '';
    if ((showAddressPopup && showExceptionPopup) || (showEstimatePopup && showSignaturePopup)) {
      fullWidth = styles.fullWidth;
    }

    let mark_status = true;
    if (showAddressPopup || showExceptionPopup || showNotesPopup || showEstimatePopup || showSignaturePopup) {
      mark_status = false;
    }

    if (endDatePassed) {
      return (
        <Popover id={`popover-share-${idx}`} title="Warning" className={cx(styles['popover-share'], fullWidth)}>
          <Grid>
            <Row>
              <Col sm={12}>
                <p>The end date of the task has passed, do you still want to mark the status?</p>
              </Col>
            </Row>
            <Row className={styles.buttons}>
              <Button className="green-btn"
                onClick={() => this.changeConfirmationStatus(idx, status, mark_status)}>Confirm</Button>
              <Button bsStyle="link" onClick={() => {
                this.closeOverlay(idx);
              }}>Cancel</Button>
            </Row>
          </Grid>
        </Popover>
      );
    } else {
      return (
        <Popover id={`popover-share-${idx}`} title="Requirements" className={cx(styles['popover-share'], fullWidth)}>
          <Grid>
            {(showAddressPopup || showExceptionPopup) &&
            <Row className={cx(style.taskFormRow)}>
              {showExceptionPopup &&
              <Col sm={showAddressPopup ? 6 : 12} xs={12}>
                <FormGroup>
                  <label>Select a reason from the list below</label>
                  <FormControl onChange={(e) => {
                    this.selectReason(e);
                  }} componentClass="select" placeholder="Select a reason">
                    <option value={null}>Select reason</option>
                    {this.props.companyProfile.exceptions.map((exception) => {
                      return (
                        <option value={exception.reason_code}>{exception.notes}</option>
                      );
                    })}
                  </FormControl>
                </FormGroup>
              </Col>}
              {showAddressPopup &&
              <Col sm={showExceptionPopup ? 6 : 12} xs={12}>
                <FormGroup>
                  <label>Choose Destination from list</label>
                  <FormControl onChange={(e) => {
                    this.changeAddress(e);
                  }} componentClass="select" placeholder="Select destination">
                    <option value={null}>Select destination</option>
                    {this.props.primaryAddress && <option
                      value="primary">{this.props.primaryAddress.title.toUpperCase() !== 'PRIMARY ADDRESS' ? this.props.primaryAddress.title + ' (Primary Address)' : this.props.primaryAddress.title}</option>}
                    {this.props.additionalAddresses && this.props.additionalAddresses.map((address, index) => {
                      return (
                        <option value={index}>{address.title !== '' ? address.title : 'Address ' + (index + 1)}</option>
                      );
                    })}
                  </FormControl>
                </FormGroup>
              </Col>}
            </Row>
            }
            {(showNotesPopup) &&
            <Row className={cx(style.taskFormRow)}>
              {showNotesPopup &&
              <Col xs={12}>
                <FieldGroup label={status.input_prompt || 'Notes'} autoFocus
                  className={cx(style['form-control'], styles.noteBox)} value={this.state.notes}
                  onChange={this.changeNote} componentClass="textarea" ref={(input) => {
                  this.inputArea = input;
                }}/>
              </Col>
              }
            </Row>
            }
            {(showEstimatePopup || showSignaturePopup) &&
            <Row className={cx(style.taskFormRow)}>
              {showEstimatePopup &&
              <Col sm={showSignaturePopup ? 6 : 12} xs={12}>
                <FormGroup className={styles['time-estimate-section']}>
                  <label>When is the Order going to be ready?</label>
                  <div className={styles['time-container']}>
                    <Row className={cx(style.taskFormRow)}>
                      <Col xs={6}><Button className={styles['time-button']} onClick={(e) => { this.changeEstimate(e, '10'); }}>10 mins</Button></Col>
                      <Col xs={6}><Button className={styles['time-button']} onClick={(e) => { this.changeEstimate(e, '20'); }}>20 mins</Button></Col>
                      <Col xs={6}><Button className={styles['time-button']} onClick={(e) => { this.changeEstimate(e, '30'); }}>30 mins</Button></Col>
                      <Col xs={6}><Button className={styles['time-button']} onClick={(e) => { this.changeEstimate(e, '40'); }}>40 mins</Button></Col>
                      <Col xs={6}><Button className={styles['time-button']} onClick={(e) => { this.changeEstimate(e, '60'); }}>60 mins</Button></Col>
                      <Col xs={6}><FieldGroup value={this.state.estimate} onChange={(e) => { this.changeEstimate(e); }} componentClass="input" className={styles.estimateInput}/></Col>
                    </Row>
                  </div>
                </FormGroup>
              </Col>}
              {showSignaturePopup &&
              <Col sm={showEstimatePopup ? 6 : 12} xs={12}>
                <FormGroup>
                  <label>Signature</label>
                  <div className={styles.signatureCanvas}>
                    <SignatureCanvas penColor='black' backgroundColor='white' canvasProps={{ height: 200, width: 238 }} ref={(ref) => { this.signCanvas = ref; }}/>
                  </div>
                </FormGroup>
              </Col>}
            </Row>}
            <Row className={cx(style.taskFormRow, styles.buttons)}>
              <Col xs={12}>
                <Button className={cx(styles['green-btn'], 'green-btn')}
                  disabled={((status.type.toUpperCase() === 'EXTRA_TIME' || status.type.toUpperCase() === 'PREPARING') && (!this.state.estimate || this.state.estimate === '0')) || this.state.savingStatus}
                  onClick={() => {
                    this.saveStatus(idx, status);
                  }}>{this.state.savingStatus ? <SavingSpinner borderStyle="none" title=''/> : 'Save'}</Button>
                <Button bsStyle="link" onClick={() => { this.closeOverlay(idx); }}>Cancel</Button>
              </Col>
            </Row>
          </Grid>
        </Popover>
      );
    }
  }

  render() {
    const { statuses } = this.props;
    let task = this.props.task;
    let endDatePassed = !this.state.confirmed && this.checkTaskEndDatePassed(task);

    return (
      <div>
        {(this.props.can_add_status || this.props.can_add_team_member) &&
        <div className={cx(style.box)}>
          <div className={cx(style.boxBody)}>
            {this.props.can_add_status &&
            <div className={cx(style.boxBodyInner)}>
              <div>
                {statuses && statuses.length ?
                  <div>
                    <div>
                      {this.props.items &&
                      <TaskItemsContainer
                        show={this.state.showItemsContainer}
                        items={this.props.items}
                        closeModal={this.closeItemsContainer}
                        saveStatus={this.saveItemsStatus}
                        profile={this.props.profile}
                        taskId={this.props.taskId}
                        orderStatus={this.state.orderStatus}
                      />
                      }
                    </div>
                    <div className={cx(styles.statusWrapper)}>
                      {statuses.map((status, idx) => {
                        if (!status.id) {
                          status.id = null;
                        }
                        if (!status.title) {
                          status.title = status.type;
                        }
                        let style = '';
                        if (!status.color) {
                          const status_object = getStatusDetails(status.type);
                          style = {
                            background: status_object.color,
                            borderColor: status_object.color
                          };
                          status.color = status_object.color;
                        } else {
                          style = {
                            background: status.color,
                            borderColor: status.color
                          };
                        }
                        let visibleToCustomer = true;
                        if (status.visible_to_customer === false || status.visible_to_customer === true) {
                          visibleToCustomer = status.visible_to_customer;
                        }
                        const button = <Button disabled={this.props.sendingStatus} onClick={() => {
                          this.handleButtonClick(status.id, status.type, status.title, status, endDatePassed, visibleToCustomer, status.color, status.custom_message_template);
                        }} className={cx(styles['btn-status'])} style={style}>{status.title || status.type}</Button>;

                        if (status.type === 'ORDER') {
                          return (
                            <div key={'status-' + idx}>
                              <Button disabled={this.props.sendingStatus}
                                onClick={() => this.openItemsModal(idx, status)}
                                className={cx(styles['btn-status'])}
                                style={style}>{status.title || status.type}</Button>
                            </div>
                          );
                        }

                        if ((this.state.current_status !== null && status.title !== this.state.current_status) || endDatePassed || status.require_signature || status.require_estimate || status.require_notes || (status.type.toUpperCase() === 'ENROUTE' && ((this.props.primaryAddress && this.props.additionalAddresses && this.props.additionalAddresses.length > 0) || ((this.props.additionalAddresses && this.props.additionalAddresses.length > 1)))) ||
                          (status.require_reason && this.props.companyProfile && this.props.companyProfile.exceptions && this.props.companyProfile.exceptions.length > 0)) {
                          return <div key={'status-' + idx}><OverlayTrigger onExit={() => {
                            this.closeOverlay(idx);
                          }} container={this} rootClose onEntered={() => {
                            this.onEnteredOverlay(idx);
                          }} trigger="click" placement="bottom" overlay={this.showRequirementPopup(idx, status, (this.state.current_status !== null && status.title !== this.state.current_status) ? true : endDatePassed)} ref={'popup-' + idx}>
                            {button}
                          </OverlayTrigger></div>;
                        }

                        return <div key={'status-' + idx}>{button}</div>;
                      })}
                    </div>
                  </div>
                  : <div className={cx(styles.emptyText)}><p>The selected template has been removed. <br/> Please select another template.</p></div>}
              </div>
            </div>
            }
            {this.props.can_add_team_member &&
            <div className={cx(style.boxBodyInner)}>
              {/*<Assignees />*/}
              <div className={styles['assignees-block']}>
                <FieldGroup
                  id="task-color"
                  ref="crewSelector"
                  name="crew-selector"
                  updateEntities={this.props.updateTaskAssigneeOnServer}
                  componentClass={CrewSelectorV2}
                  allEntities={this.props.entities}
                  entities={this.props.task.entity_ids}
                  placeholder="Assign team member"
                  startDate={this.props.task.start}
                  endDate={this.props.task.end}
                  getSchedule={this.props.getSchedule}
                  entity_confirmation_statuses={this.props.task.entity_confirmation_statuses}
                  profile={this.props.companyProfile}
                  canEdit={false}
                  elId={Math.random().toString(36).substr(2, 16)}
                  placeholderImage={'/images/user-default.svg'}
                />
              </div>
            </div>
            }
          </div>
        </div>
        }
      </div>
    );
  }
}
